// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use clipboard::{ClipboardContext, ClipboardProvider};
use std::fs::OpenOptions;
use std::io::Write;
use std::io::{BufRead, BufReader};
use std::sync::Mutex;
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Manager};

fn main() {
    // Load items from file at startup
    load_items_from_file();

    thread::spawn(listen);

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            items,
            set_data,
            clear,
            toggle_window,
            hide
        ])
        .run(tauri::generate_context!())
        .expect("Error while running tauri application");
}

const MAX_ITEMS: usize = 50;
static CONTAINER: Mutex<Vec<String>> = Mutex::new(Vec::new());

fn load_items_from_file() {
    let file = OpenOptions::new()
        .read(true)
        .write(true)
        .create(true)
        .open("clipboard_items.txt")
        .expect("Failed to open file");

    let reader = BufReader::new(file);

    let mut container = CONTAINER.lock().expect("Failed to acquire lock");
    let mut current_item = String::new();
    for line in reader.lines() {
        let line = line.expect("Failed to read line");
        if line == "---" {
            container.push(current_item.clone());
            current_item.clear();
        } else {
            if !current_item.is_empty() {
                current_item.push('\n');
            }
            current_item.push_str(&line);
        }
    }
    if !current_item.is_empty() {
        container.push(current_item);
    }
}

fn listen() {
    let mut clipboard: ClipboardContext =
        ClipboardProvider::new().expect("Failed to create clipboard context");
    let mut last_clipboard_contents = clipboard.get_contents().unwrap_or_else(|_| "".to_string());
    loop {
        match clipboard.get_contents() {
            Ok(current_clipboard_contents)
                if !current_clipboard_contents.is_empty()
                    && current_clipboard_contents != last_clipboard_contents =>
            {
                last_clipboard_contents = current_clipboard_contents.clone();
                set(last_clipboard_contents.clone());
            }
            Err(e) => println!("get clipboard error: {:?}", e),
            _ => (),
        }
        thread::sleep(Duration::from_millis(1500));
    }
}

#[tauri::command]
fn items(s: String) -> Vec<String> {
    CONTAINER
        .lock()
        .unwrap()
        .iter()
        .filter(|&x| s.len() == 0 || (*x).contains(&s))
        .cloned()
        .rev()
        .collect()
}

#[tauri::command]
fn set_data(data: String) -> String {
    let mut clipboard: ClipboardContext = ClipboardProvider::new().unwrap();
    match clipboard.set_contents(data) {
        Err(e) => format!("set clipboard error: {:?}", e),
        _ => format!("OK"),
    }
}

fn set(data: String) {
    let mut container = CONTAINER.lock().expect("Failed to acquire lock");

    container.push(data.clone());

    if container.len() > MAX_ITEMS {
        let overflow = container.len() - MAX_ITEMS;
        container.drain(..overflow);
    }

    // Write the new item to the file
    let mut file = OpenOptions::new()
        .append(true)
        .open("clipboard_items.txt")
        .expect("Failed to open file");
    writeln!(file, "{}\n---\n", data).expect("Failed to write to file");
}

#[tauri::command]
fn clear() {
    CONTAINER.lock().unwrap().clear();
}

#[tauri::command]
fn toggle_window(app: AppHandle) {
    let window = app.get_window("main").unwrap();
    if window.is_visible().unwrap() {
        window.hide().unwrap();
    } else {
        window.show().unwrap();
        window.set_focus().unwrap();
    }
}

#[tauri::command]
fn hide(app: AppHandle) {
    let window = app.get_window("main").unwrap();
    window.hide().unwrap();
}
