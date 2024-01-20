# ClipRust - A Clipboard Manager

ClipRust is a clipboard manager application that is designed to enhance the functionality of the system clipboard. It is built using Tauri, a framework for building lightweight, secure, and cross-platform desktop applications with web technologies, and TypeScript, a statically typed superset of JavaScript that adds optional types.

## What It Is Used For

ClipRust is used for managing clipboard data. It allows users to copy and delete clipboard items, and it displays notifications to inform users when an action has been performed. This makes it easier for users to keep track of their clipboard history and manage their copied items.

<div float="left">
  <img src="./screenshot/Screen Shot 1.png" width="400" />
  <img src="./screenshot/Screen Shot 2.png" width="400" /> 
  <img src="./screenshot/Screen Shot 3.png" width="400" />
  <img src="./screenshot/Screen Shot 4.png" width="400" />
  <img src="./screenshot/Screen Shot 5.png" width="400" />
</div>


## How to Use It

To use ClipRust, you first need to install it on your machine. The installation process involves cloning the repository, navigating into the project directory, installing the dependencies, and building the Tauri application. Once installed, you can start the application by running the Tauri development server.

Here are the steps to install and use ClipRust:

1. Clone the repository: `git clone https://github.com/milinbhakta/ClipRust.git`
2. Navigate into the project directory: `cd ClipRust`
3. Install the dependencies: `npm install`
4. Build the Tauri application: `npm run tauri build`
5. Start the application: `npm run tauri dev`

Once the application is running, you can copy and delete clipboard items using the user interface.

## What Problem It Solves

The system clipboard typically only allows for one item to be stored at a time. This can be limiting when you need to copy and paste multiple items frequently. ClipRust solves this problem by providing a clipboard manager that allows for multiple items to be stored and managed. This can greatly improve productivity and efficiency when working with copied data.

## Project Structure

- `src/`: Contains the TypeScript source files and assets for the frontend of the application.
- `src-tauri/`: Contains the Rust source files for the backend of the application.
- `vite.config.ts`: Configuration file for Vite, which is used for bundling the frontend code.
- `tsconfig.json`: Configuration file for TypeScript.
- `.env`: Contains environment variables for the project. This file is ignored by Git for security reasons.
- `.env.sample`: A template for the `.env` file. You can copy this file to `.env` and fill in your own values.

## Development

To start the development server, run `npm run tauri dev`. This will start the Tauri development server and open the Tauri window.

## Contributing

Contributions are welcome! Please read our [contributing guide](CONTRIBUTING.md) to learn about our development process, how to propose bugfixes and improvements, and how to build and test your changes.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
