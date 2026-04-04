use crate::ast::{AstNode, NmlDocument};
use nom::branch::alt;
use nom::bytes::complete::{is_not, tag, take_till, take_while, take_while1};
use nom::character::complete::multispace0;
use nom::combinator::{all_consuming, map, recognize};
use nom::multi::many0;
use nom::sequence::{delimited, pair};
use nom::{IResult, Parser};
use std::collections::BTreeMap;
use std::fmt;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ParseError(pub String);

impl fmt::Display for ParseError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl std::error::Error for ParseError {}

fn is_name_start(c: char) -> bool {
    !c.is_whitespace() && c != '<' && c != '>' && c != '/' && c != '=' && c != '"' && c != '\''
}

fn is_name_char(c: char) -> bool {
    !c.is_whitespace() && c != '<' && c != '>' && c != '/' && c != '=' && c != '"' && c != '\''
}

fn parse_name(input: &str) -> IResult<&str, &str> {
    recognize(pair(take_while1(is_name_start), take_while(is_name_char))).parse(input)
}

fn parse_name_owned(input: &str) -> IResult<&str, String> {
    map(parse_name, str::to_string).parse(input)
}

fn parse_attr_value(input: &str) -> IResult<&str, String> {
    alt((
        map(
            delimited(tag("\""), many0(is_not("\"")), tag("\"")),
            |parts: Vec<&str>| parts.concat(),
        ),
        map(
            delimited(tag("'"), many0(is_not("'")), tag("'")),
            |parts: Vec<&str>| parts.concat(),
        ),
    ))
    .parse(input)
}

fn parse_attribute(input: &str) -> IResult<&str, (String, String)> {
    let (input, _) = take_while1(|c: char| c.is_whitespace()).parse(input)?;
    let (input, key) = parse_name_owned(input)?;
    let (input, _) = multispace0.parse(input)?;
    let (input, _) = tag("=").parse(input)?;
    let (input, _) = multispace0.parse(input)?;
    let (input, value) = parse_attr_value(input)?;
    Ok((input, (key, value)))
}

fn parse_start_tag(input: &str) -> IResult<&str, (String, BTreeMap<String, String>, bool)> {
    let (input, _) = tag("<").parse(input)?;
    let (input, name) = parse_name_owned(input)?;
    let (input, attrs) = many0(parse_attribute).parse(input)?;
    let (input, _) = multispace0.parse(input)?;
    let (input, self_close) = alt((map(tag("/>"), |_| true), map(tag(">"), |_| false))).parse(input)?;

    let mut map = BTreeMap::new();
    for (k, v) in attrs {
        map.insert(k, v);
    }
    Ok((input, (name, map, self_close)))
}

fn parse_end_tag<'a>(expected_name: &str) -> impl FnMut(&'a str) -> IResult<&'a str, ()> + '_ {
    move |input: &'a str| {
        let (input, _) = tag("</").parse(input)?;
        let (input, name) = parse_name_owned(input)?;
        let (input, _) = multispace0.parse(input)?;
        let (input, _) = tag(">").parse(input)?;
        if name != expected_name {
            return Err(nom::Err::Failure(nom::error::Error::new(input, nom::error::ErrorKind::Tag)));
        }
        Ok((input, ()))
    }
}

fn parse_text(input: &str) -> IResult<&str, String> {
    map(take_till(|c| c == '<'), |s: &str| s.trim().to_string()).parse(input)
}

fn parse_node(input: &str) -> IResult<&str, AstNode> {
    let (mut input, (tag_name, attributes, self_close)) = parse_start_tag(input)?;

    if self_close {
        return Ok((
            input,
            AstNode {
                tag: tag_name,
                attributes,
                text: None,
                children: Vec::new(),
            },
        ));
    }

    let mut children = Vec::new();
    let mut text: Option<String> = None;

    loop {
        let (next, _) = multispace0.parse(input)?;
        input = next;

        if input.starts_with("</") {
            let (next, _) = parse_end_tag(&tag_name)(input)?;
            input = next;
            break;
        }

        if input.starts_with('<') {
            let (next, child) = parse_node(input)?;
            children.push(child);
            input = next;
        } else {
            let (next, chunk) = parse_text(input)?;
            if !chunk.is_empty() {
                text = match text {
                    Some(existing) => Some(format!("{} {}", existing, chunk)),
                    None => Some(chunk),
                };
            }
            input = next;
        }
    }

    Ok((
        input,
        AstNode {
            tag: tag_name,
            attributes,
            text,
            children,
        },
    ))
}

pub fn parse_nml(source: &str) -> Result<NmlDocument, ParseError> {
    let mut parser = all_consuming(delimited(multispace0, parse_node, multispace0));
    match parser.parse(source) {
        Ok((_, root)) => Ok(NmlDocument { root }),
        Err(e) => Err(ParseError(format!("NML parse failed: {e:?}"))),
    }
}

#[cfg(test)]
mod tests {
    use super::parse_nml;
    use pretty_assertions::assert_eq;

    #[test]
    fn parses_minimal_chinese_nml() {
        let src = r#"
<小说项目 名称="测试" 版本="2.1-M1">
  <元数据 />
  <正文>
    <章节 序号="1" 标题="章">
      <场景 id="s1" 地点引用="l1">
        <任务 目标="测试"/>
      </场景>
    </章节>
  </正文>
</小说项目>
"#;
        let doc = parse_nml(src).expect("must parse");
        assert_eq!(doc.root.tag, "小说项目");
        assert_eq!(doc.root.attributes.get("名称").map(String::as_str), Some("测试"));
        assert_eq!(doc.root.children.len(), 2);
    }

    #[test]
    fn parses_text_node() {
        let src = r#"<根><段>这是文本</段></根>"#;
        let doc = parse_nml(src).expect("must parse");
        let seg = &doc.root.children[0];
        assert_eq!(seg.tag, "段");
        assert_eq!(seg.text.as_deref(), Some("这是文本"));
    }

    #[test]
    fn parses_single_quote_attributes_and_self_closing() {
        let src = r#"<根 a='1'><子 b='x'/></根>"#;
        let doc = parse_nml(src).expect("must parse");
        assert_eq!(doc.root.attributes.get("a").map(String::as_str), Some("1"));
        assert_eq!(doc.root.children.len(), 1);
        assert_eq!(doc.root.children[0].tag, "子");
        assert_eq!(doc.root.children[0].attributes.get("b").map(String::as_str), Some("x"));
    }

    #[test]
    fn rejects_mismatched_end_tag() {
        let src = r#"<根><子></根>"#;
        let err = parse_nml(src).expect_err("must fail");
        assert!(err.to_string().contains("NML parse failed"));
    }
}
