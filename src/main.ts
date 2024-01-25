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
  private lastItems: ClipboardItem[] = [];
  private isSearching: boolean = false;

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

  private areItemsEqual(
    items1: ClipboardItem[],
    items2: ClipboardItem[]
  ): boolean {
    if (items1.length !== items2.length) {
      return false;
    }
    for (let i = 0; i < items1.length; i++) {
      if (
        items1[i].data !== items2[i].data ||
        items1[i].data_type !== items2[i].data_type
      ) {
        return false;
      }
    }
    return true;
  }

  private async createCodeContainer(item: ClipboardItem) {
    // Create the main container
    const container = document.createElement("div");
    container.className = "code-container";

    // Create the pre and code elements
    const pre = document.createElement("pre");
    const code = document.createElement("code");

    if (item.data_type === "image") {
      const img = document.createElement("img");
      img.src = "data:image/png;base64," + item.data;
      img.alt = "image";
      img.className = "image-container";
      container.appendChild(img);
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

  private async updateUIWithItems(
    items: ClipboardItem[],
    isSearch: boolean = false
  ) {
    if (this.clipContainer) {
      // Clear the clipContainer
      this.clipContainer.innerHTML = "";

      // Create a DocumentFragment to hold the new items
      const fragment = document.createDocumentFragment();

      for (const item of items) {
        const tmp = await this.createCodeContainer(item);

        // Add the "append" class to new items only
        if (!this.lastItems.some((prevItem) => prevItem.data === item.data)) {
          tmp.classList.add("append");
        }

        fragment.appendChild(tmp);
      }

      // Append all the new items at once
      this.clipContainer.appendChild(fragment);
    }

    // Update the previous response only if it's not a search operation
    if (!isSearch) {
      this.lastItems = items;
    }
  }

  private async handleSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target) {
      if (target.value === "") {
        // If the input is an empty string, load lastItems
        await this.updateUIWithItems(this.lastItems, true);
      } else {
        this.isSearching = true;
        invoke("items", { s: target.value }).then(async (response: unknown) => {
          const items = response as ClipboardItem[];
          if (!this.areItemsEqual(items, this.lastItems)) {
            // Call updateUIWithItems with isSearch set to true
            await this.updateUIWithItems(items, true);
          }
        });
        this.isSearching = false;
      }
    }
  }

  public async init() {
    if (!this.isSearching) {
      invoke("items", { s: "" }).then(async (res: unknown) => {
        const response = res as ClipboardItem[];
        if (!this.areItemsEqual(response, this.lastItems)) {
          await this.updateUIWithItems(response);
        }
      });
    }
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

  public registerSearchBox(searchBoxId: string) {
    const searchBox = document.getElementById(searchBoxId) as HTMLInputElement;
    if (searchBox) {
      searchBox.addEventListener(
        "input",
        async (event) => await this.handleSearch(event)
      );
    }
  }
}

const clipboardManager = new ClipboardManager("clipContainer");
clipboardManager.registerShortcut();
clipboardManager.registerSearchBox("search");
setInterval(() => clipboardManager.init(), 1000);

class ThemeSwitcher {
  private _scheme: string = "auto";
  private change = {
    light: '<i class="fas fa-moon"></i>',
    dark: '<i class="fas fa-sun"></i> ',
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
      button.setAttribute("aria-label", `Switch to ${this.scheme} mode`);
      button.setAttribute("data-tooltip", `Switch to ${this.scheme} mode`);
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
  class: "theme-switcher",
  target: "#header",
});
themeSwitcher.init();

document.addEventListener("DOMContentLoaded", function () {
  const scrollToTopBtn = document.getElementById("scrollToTop");

  if (scrollToTopBtn !== null) {
    let lastScrollY = window.scrollY;
    let ticking = false;

    window.addEventListener("scroll", function () {
      lastScrollY = window.scrollY;
      if (!ticking) {
        window.requestAnimationFrame(function () {
          if (lastScrollY > 20) {
            scrollToTopBtn.style.display = "block";
          } else {
            scrollToTopBtn.style.display = "none";
          }
          ticking = false;
        });
        ticking = true;
      }
    });

    scrollToTopBtn.addEventListener("click", function () {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  }
});
