# ClipRust - A Clipboard Manager

ClipRust is a clipboard manager built with [Tauri](https://tauri.studio/) and [TypeScript](https://www.typescriptlang.org/).

## Project Structure

- `src/`: Contains the TypeScript source files and assets for the frontend of the application.
- `src-tauri/`: Contains the Rust source files for the backend of the application.
- `vite.config.ts`: Configuration file for Vite, which is used for bundling the frontend code.
- `tsconfig.json`: Configuration file for TypeScript.
- `.env`: Contains environment variables for the project. This file is ignored by Git for security reasons.
- `.env.sample`: A template for the `.env` file. You can copy this file to `.env` and fill in your own values.

## Getting Started

To get started with this project, you need to have [Node.js](https://nodejs.org/) and [Rust](https://www.rust-lang.org/) installed on your machine.

1. Clone the repository: `git clone https://github.com/milinbhakta/cliprust.git`
2. Navigate into the project directory: `cd cliprust`
3. Install the dependencies: `npm install`
4. Build the Tauri application: `npm run tauri build`

## Development

To start the development server, run `npm run tauri dev`. This will start the Tauri development server and open the Tauri window.

## Contributing

Contributions are welcome! Please read our [contributing guide](CONTRIBUTING.md) to learn about our development process, how to propose bugfixes and improvements, and how to build and test your changes.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.