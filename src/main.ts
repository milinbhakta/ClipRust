import { invoke } from "@tauri-apps/api/tauri";
import { globalShortcut } from "@tauri-apps/api";

interface ClipboardItem {
  data: string;
  data_type:
    | "image"
    | "text"
    | "html"
    | "rtf"
    | "bookmark"
    | "file"
    | "application"
    | "extension"
    | "unknown";
}

class ClipboardManager {
  private clipContainer: HTMLElement | null;
  private previousResponse: string[] = [];

  constructor(containerId: string) {
    this.clipContainer = document.getElementById(containerId);
  }

  private handleCopy(item: ClipboardItem, event: MouseEvent) {
    const target = event.target as Element;
    event.stopPropagation();
    if (
      item &&
      item.data !== "" &&
      item.data_type &&
      target &&
      target.classList.contains("fa-copy")
    ) {
      invoke("set_data", { item: item }).then((response: unknown) => {
        if (response === "OK") {
          const snackbar = document.getElementById("snackbar");
          const snackbarText = document.getElementById("snackbar-message");

          if (snackbar && snackbarText) {
            snackbar.className = "show";
            snackbarText.textContent = "Copied to clipboard!";
            setTimeout(() => {
              snackbar.className = snackbar.className.replace("show", "");
            }, 3000);
          }
        } else {
          console.error("An error occurred");
        }
      });
    }
  }

  private handleDelete(item: ClipboardItem, event: MouseEvent) {
    const target = event.target as Element;
    event.stopPropagation();
    if (
      item &&
      item.data !== "" &&
      item.data_type &&
      target &&
      target.classList.contains("fa-trash")
    ) {
      invoke("delete_item", { item: item }).then((response: unknown) => {
        if (response === "OK") {
          const snackbar = document.getElementById("snackbar");
          const snackbarText = document.getElementById("snackbar-message");
          if (snackbar && snackbarText) {
            snackbar.className = "show";
            snackbarText.textContent = "Deleted!";
            setTimeout(() => {
              snackbar.className = snackbar.className.replace("show", "");
            }, 3000);
          }
        } else {
          console.error("An error occurred");
        }
      });
    }
  }

  private getFileTypeFromBase64(base64String: string) {
    try {
      const byteCharacters = atob(base64String);
      const byteNumbers = new Array(byteCharacters.length);

      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray]);
      const file = new File([blob], "dummyFileName", { type: blob.type });

      // You can use file.type to get the MIME type, and then determine the file extension if needed.
      return file.type.split("/")[1] || null;
    } catch (error) {
      console.error("Error getting file type:", error);
      return null;
    }
  }

  private async createCodeContainer(item: ClipboardItem) {
    // Create the main container
    const container = document.createElement("div");
    container.className = "code-container";

    // Create the pre and code elements
    const pre = document.createElement("pre");
    const code = document.createElement("code");

    if (item.data_type === "image") {
      try {
        const fileType = this.getFileTypeFromBase64(item.data);

        if (fileType) {
          console.log("File Type:", fileType);
        } else {
          console.error("Unable to determine file type.");
        }

        const img = document.createElement("img");
        img.src = "data:image/png;base64," + item.data;
        img.alt = "image";
        img.className = "image-container";
        container.appendChild(img);
      } catch (error) {
        console.error("Failed to load image from clipboard: ", error);
      }
    } else {
      code.textContent = item.data;
      pre.appendChild(code);
      // Append the code to the pre, and the pre to the main container
      container.appendChild(pre);
    }

    // Create the actions container
    const actions = document.createElement("div");
    actions.className = "code-actions items";
    // Create the copy button
    const copyButton = document.createElement("button");
    copyButton.title = "Copy";
    copyButton.setAttribute("aria-label", "Copy");
    copyButton.setAttribute("data-tooltip", "Copy");
    const copyIcon = document.createElement("i");
    copyIcon.className = "fas fa-copy btn-color";
    copyButton.addEventListener("click", (event) => {
      this.handleCopy(item, event);
    });
    copyButton.appendChild(copyIcon);
    // Create the delete button
    const deleteButton = document.createElement("button");
    deleteButton.title = "Delete";
    deleteButton.setAttribute("aria-label", "Delete");
    deleteButton.setAttribute("data-tooltip", "Delete");
    const deleteIcon = document.createElement("i");
    deleteIcon.className = "fas fa-trash btn-color";
    deleteButton.addEventListener("click", (event) => {
      this.handleDelete(item, event);
    });
    deleteButton.appendChild(deleteIcon);
    // Append the buttons to the actions container
    actions.appendChild(copyButton);
    actions.appendChild(deleteButton);
    // Append the actions container to the main container
    container.appendChild(actions);
    // Return the main container
    return container;
  }

  public init() {
    invoke("items", { s: "" }).then(async (res: unknown) => {
      const response = res as ClipboardItem[];

      // Check if the response is different from the previous response
      if (JSON.stringify(response) !== JSON.stringify(this.previousResponse)) {
        if (this.clipContainer) {
          // Clear the clipContainer
          this.clipContainer.innerHTML = "";

          // Create a DocumentFragment to hold the new items
          const fragment = document.createDocumentFragment();

          for (const item of response) {
            const tmp = await this.createCodeContainer(item);

            // Add the "append" class to new items only
            if (!this.previousResponse.includes(item.data)) {
              tmp.classList.add("append");
            }

            fragment.appendChild(tmp);
          }

          // Append all the new items at once
          this.clipContainer.appendChild(fragment);
        }

        // Update the previous response
        this.previousResponse = response.map((item) => item.data.toString());
      }
    });
  }

  public registerShortcut() {
    let shortcutId: Promise<void> = globalShortcut.register(
      "CommandOrControl+Shift+C",
      () => {
        invoke("toggle_window", {}).then((response: unknown) => {
          console.log(response);
        });
      }
    );

    // Check if the shortcut was registered successfully
    shortcutId
      .then(() => {
        console.log("Global shortcut registered successfully");
      })
      .catch((error) => {
        console.error("Failed to register global shortcut:", error);
      });
  }
}

const clipboardManager = new ClipboardManager("clipContainer");
clipboardManager.registerShortcut();
setInterval(() => clipboardManager.init(), 1000);

class ThemeSwitcher {
  private _scheme: string = "auto";
  private change = {
    light: "<i>Turn on dark mode</i>",
    dark: "<i>Turn off dark mode</i>",
  };
  private buttonsTarget: string = ".theme-switcher";
  private localStorageKey: string = "picoPreferredColorScheme";

  init() {
    this.scheme = this.schemeFromLocalStorage;
    this.initSwitchers();
  }

  get schemeFromLocalStorage(): string {
    return (
      (window.localStorage &&
        window.localStorage.getItem(this.localStorageKey)) ||
      this._scheme
    );
  }

  get preferredColorScheme(): string {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  initSwitchers() {
    document.querySelectorAll(this.buttonsTarget).forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          this.scheme = this.scheme === "dark" ? "light" : "dark";
        },
        false
      );
    });
  }

  addButton(button: { tag: string; class: string; target: string }) {
    const element = document.createElement(button.tag);
    element.className = button.class;
    document.querySelector(button.target)?.appendChild(element);
  }

  set scheme(scheme: string) {
    if (scheme === "auto") {
      this._scheme = this.preferredColorScheme;
    } else if (scheme === "dark" || scheme === "light") {
      this._scheme = scheme;
    }
    this.applyScheme();
    this.schemeToLocalStorage();
  }

  get scheme(): string {
    return this._scheme;
  }

  applyScheme() {
    document.querySelector("html")?.setAttribute("data-theme", this.scheme);
    document.querySelectorAll(this.buttonsTarget).forEach((button) => {
      const change =
        this.scheme === "dark" ? this.change.dark : this.change.light;
      button.innerHTML = change;
      button.setAttribute("aria-label", change.replace(/<[^>]*>?/gm, ""));
    });
  }

  schemeToLocalStorage() {
    if (window.localStorage) {
      window.localStorage.setItem(this.localStorageKey, this.scheme);
    }
  }
}

const themeSwitcher = new ThemeSwitcher();
themeSwitcher.addButton({
  tag: "BUTTON",
  class: "contrast switcher theme-switcher",
  target: "body",
});
themeSwitcher.init();
