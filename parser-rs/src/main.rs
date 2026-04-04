use nml_parser_rs::parse_nml;
use std::env;
use std::fs;
use std::process::ExitCode;

fn usage() {
    eprintln!("Usage: nml-parser-rs <file.nml> [--pretty]");
}

fn main() -> ExitCode {
    let mut args = env::args().skip(1);
    let mut file: Option<String> = None;
    let mut pretty = false;

    for arg in args.by_ref() {
        if arg == "--pretty" {
            pretty = true;
        } else if arg.starts_with('-') {
            eprintln!("Unknown option: {arg}");
            usage();
            return ExitCode::from(2);
        } else if file.is_none() {
            file = Some(arg);
        } else {
            eprintln!("Unexpected positional argument: {arg}");
            usage();
            return ExitCode::from(2);
        }
    }

    let Some(file_path) = file else {
        usage();
        return ExitCode::from(2);
    };

    let source = match fs::read_to_string(&file_path) {
        Ok(s) => s,
        Err(err) => {
            eprintln!("Failed to read {file_path}: {err}");
            return ExitCode::from(1);
        }
    };

    let doc = match parse_nml(&source) {
        Ok(doc) => doc,
        Err(err) => {
            eprintln!("{err}");
            return ExitCode::from(1);
        }
    };

    let json = if pretty {
        serde_json::to_string_pretty(&doc)
    } else {
        serde_json::to_string(&doc)
    };

    match json {
        Ok(output) => {
            println!("{output}");
            ExitCode::SUCCESS
        }
        Err(err) => {
            eprintln!("Failed to serialize AST: {err}");
            ExitCode::from(1)
        }
    }
}
