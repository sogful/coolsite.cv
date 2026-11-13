use std::path::Path;

////////////////////////////////////////////////////////////////////////

fn main() {
    let arguments: Vec<String> = std::env::args().collect();
    let Some(input) = arguments.get(1) else { std::process::exit(2) };
    if let Err(error) = iwm_parser::build_package(Path::new(input), Path::new("/output"), &[]) {
        eprintln!("{error:#}");
        std::process::exit(1);
    }
    let package = match iwm_runtime_model::read_runtime_package_dir(Path::new("/output")) {
        Ok(package) => package,
        Err(error) => {eprintln!("{error:#}"); std::process::exit(1);}
    };
    let report = iwm_runtime_model::validate_runtime_package(&package);
    if !report.valid {
        eprintln!("Invalid converted package: {:?}", report.errors);
        std::process::exit(1);
    }
}

