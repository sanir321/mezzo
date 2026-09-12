class AuthModalStore {
  private _isOpen = $state(false);
  private _mode = $state<"login" | "signup">("login");

  get isOpen() {
    return this._isOpen;
  }

  set isOpen(v: boolean) {
    this._isOpen = v;
  }

  get mode() {
    return this._mode;
  }

  set mode(v: "login" | "signup") {
    this._mode = v;
  }

  open(mode: "login" | "signup" = "login") {
    this._mode = mode;
    this._isOpen = true;
  }

  close() {
    this._isOpen = false;
  }
}

export const authModal = new AuthModalStore();
