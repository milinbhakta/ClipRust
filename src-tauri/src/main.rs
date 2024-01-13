// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use clipboard::{ClipboardContext, ClipboardProvider};
use std::sync::Mutex;
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Manager};

fn main() {
    thread::spawn(listen);

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            items,
            set_data,
            clear,
            toggle_window,
            hide,
            delete_item
        ])
        .run(tauri::generate_context!())
        .expect("Error while running tauri application");
}

const MAX_ITEMS: usize = 50;
static CONTAINER: Mutex<Vec<String>> = Mutex::new(Vec::new());

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

    if !container.contains(&data) {
        container.push(data);
    }

    if container.len() > MAX_ITEMS {
        let overflow = container.len() - MAX_ITEMS;
        container.drain(..overflow);
    }
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

#[tauri::command]
fn delete_item(data: String) -> Result<String, String> {
    let mut container = CONTAINER.lock().unwrap();
    if container.contains(&data) {
        container.retain(|x| x != &data);
        Ok("OK".to_string())
    } else {
        Err("Item not found".to_string())
    }
}
