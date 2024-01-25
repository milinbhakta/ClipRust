// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use arboard::{Clipboard, Error as ClipboardError, ImageData};
mod util;
use serde::{Deserialize, Serialize};
use std::borrow::Cow;
use std::sync::Mutex;
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Manager};

#[derive(Clone, Serialize, Deserialize, Debug)]
struct Item {
    data: String,
    data_type: String,
}
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
// save container with data and its type
static CONTAINER: Mutex<Vec<(String, String)>> = Mutex::new(Vec::new());

fn listen() {
    let mut clipboard: Clipboard = Clipboard::new().expect("Failed to create clipboard context");

    // Get last clipboard contents
    let mut last_clipboard_contents = clipboard.get_text().unwrap_or_default();

    // Get last image contents
    let mut last_image_contents: Option<String> = None;

    loop {
        match clipboard.get_text() {
            Ok(current_clipboard_contents)
                if !current_clipboard_contents.is_empty()
                    && current_clipboard_contents != last_clipboard_contents =>
            {
                last_clipboard_contents = current_clipboard_contents.clone();
                set(last_clipboard_contents.clone(), "text".to_string());
            }
            Err(e) => match e {
                ClipboardError::ContentNotAvailable => last_clipboard_contents = "".to_string(),
                _ => println!("get clipboard error: {:?}", e),
            },
            _ => (),
        }
        match clipboard.get_image() {
            Ok(image) => {
                let base64_str = util::image_data_to_base64(&image);
                if Some(base64_str.clone()) != last_image_contents {
                    set(base64_str.clone(), "image".to_string());
                    last_image_contents = Some(base64_str);
                }
            }
            Err(e) => match e {
                ClipboardError::ContentNotAvailable => last_image_contents = None,
                _ => println!("get image error: {:?}", e),
            },
        }
        thread::sleep(Duration::from_millis(1500));
    }
}

#[tauri::command]
fn items(s: String) -> Vec<Item> {
    CONTAINER
        .lock()
        .unwrap()
        .iter()
        .filter(|(data, _)| s.len() == 0 || data.contains(&s))
        .map(|(data, data_type)| Item {
            data: data.clone(),
            data_type: data_type.clone(),
        })
        .rev()
        .collect()
}

#[tauri::command]
fn set_data(item: Item) -> Result<String, String> {
    let mut clipboard: Clipboard = Clipboard::new().unwrap();
    match item.data_type.as_str() {
        "text" => match clipboard.set_text(item.data.clone()) {
            Err(e) => Err(format!("set clipboard text error: {:?}", e)),
            _ => Ok(format!("OK")),
        },
        "image" => {
            // Load the image from decoded data
            let img = util::base64_str_to_image_data(item.data);

            // Convert the image to ImageData
            let img_data = ImageData {
                height: img.height() as usize,
                width: img.width() as usize,
                bytes: Cow::Owned(img.into_bytes()),
            };
            // Set the image to the clipboard
            clipboard
                .set_image(img_data)
                .map(|_| "OK".to_string())
                .map_err(|err| {
                    // Log or print the original error for debugging
                    println!("Error setting image to clipboard: {:?}", err);
                    err.to_string()
                })
        }
        _ => Err(format!("Unsupported item kind: {}", item.data_type)),
    }
}

fn set(data: String, data_type: String) {
    let mut container = CONTAINER.lock().unwrap();
    if !container.iter().any(|(d, t)| d == &data && t == &data_type) {
        if container.len() >= MAX_ITEMS {
            container.remove(0);
        }
        container.push((data, data_type));
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
fn delete_item(item: Item) -> Result<String, String> {
    let mut container = CONTAINER.lock().unwrap();
    let initial_len = container.len();
    container.retain(|(data, data_type)| data != &item.data || data_type != &item.data_type);
    if container.len() < initial_len {
        let mut clipboard: Clipboard = Clipboard::new().unwrap();
        clipboard.clear().map_err(|err| {
            // Log or print the original error for debugging
            println!("Error clearing clipboard: {:?}", err);
            err.to_string()
        })?;
        Ok("OK".to_string())
    } else {
        Err("Item not found".to_string())
    }
}