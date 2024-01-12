import { invoke } from "@tauri-apps/api/tauri";
import { globalShortcut } from "@tauri-apps/api";

const clipContainer = document.getElementById("clipContainer");

if (clipContainer) {
  clipContainer.addEventListener("click", function (event) {
    const target = event.target as Element;
    if (target.classList.contains("item") && target.textContent) {
      invoke("set_data", { data: target.textContent }).then(
        (response: unknown) => {
          if (response === "OK") {
            navigator.clipboard.writeText(target.textContent ?? "").then(() => {
              const snackbar = document.getElementById("snackbar");
              if (snackbar) {
                snackbar.className = "show";
                snackbar.textContent = "Copied to clipboard!";
                setTimeout(() => {
                  snackbar.className = snackbar.className.replace("show", "");
                }, 3000);
              }
            });
          } else {
            console.error("An error occurred");
          }
        }
      );
    }
  });
}

let shortcutId: Promise<void> = globalShortcut.register("Ctrl+Alt+G", () => {
  invoke("toggle_window", {}).then((response: unknown) => {
    console.log(response);
  });
});

// Check if the shortcut was registered successfully
shortcutId
  .then(() => {
    console.log("Global shortcut registered successfully");
  })
  .catch((error) => {
    console.error("Failed to register global shortcut:", error);
  });

const content = document.getElementById("content");
if (content) {
  content.addEventListener("click", function (event) {
    const target = event.target as HTMLElement;
    if (target && target.classList.contains("item")) {
      invoke("set_data", { data: target.textContent || "" }).then(
        (response: unknown) => {
          if (response === "OK") {
            navigator.clipboard.writeText(target.textContent ?? "").then(() => {
              const snackbar = document.getElementById("snackbar");
              if (snackbar) {
                snackbar.className = "show";
                snackbar.textContent = "Copied to clipboard!";
                setTimeout(() => {
                  snackbar.className = snackbar.className.replace("show", "");
                }, 3000);
              }
            });
          } else {
            console.error("An error occurred");
          }
        }
      );
    }
  });
}

function init() {
  invoke("items", { s: "" }).then((res: unknown) => {
    const response = res as string[];
    const content = document.querySelector("#clipContainer");
    const firstItem = content?.querySelector(".item:first-child");
    const first = firstItem ? firstItem.textContent : null;

    if (first === response[0]) {
      console.log("not change");
      return;
    }

    if (content) {
      while (content.firstChild) {
        content.removeChild(content.firstChild);
      }

      for (const item of response) {
        const tmp = document.createElement("article");
        tmp.className = "item";
        tmp.textContent = item;
        content.appendChild(tmp);
      }
    }
  });
}

setInterval(init, 1000);
