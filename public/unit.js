(() => {
  const script = document.currentScript;
  if (!script || !/^[a-f0-9]{64}$/.test(script.dataset.unit || "")) return;
  const url = new URL("/pay/" + script.dataset.unit, script.src);
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "FlowKey orqali to‘lash";
  button.style.cssText =
    "padding:12px 20px;background:#245eea;color:white;border:0;border-radius:8px;font:inherit;cursor:pointer";
  button.addEventListener("click", () => {
    const dialog = document.createElement("dialog");
    dialog.setAttribute("aria-label", "FlowKey Unit to‘lov oynasi");
    dialog.style.cssText =
      "width:min(640px,90vw);height:min(760px,85vh);padding:16px;border:1px solid #e4eaf2;border-radius:10px";
    const close = document.createElement("button");
    close.type = "button";
    close.textContent = "Yopish";
    close.style.cssText = "padding:12px;cursor:pointer";
    const frame = document.createElement("iframe");
    frame.src = url.href;
    frame.title = "Unit to‘lov sahifasi";
    frame.style.cssText = "width:100%;height:90%;border:0";
    close.onclick = () => dialog.close();
    dialog.addEventListener("close", () => {
      dialog.remove();
      button.focus();
    });
    dialog.append(close, frame);
    document.body.append(dialog);
    dialog.showModal();
    close.focus();
  });
  script.after(button);
})();
