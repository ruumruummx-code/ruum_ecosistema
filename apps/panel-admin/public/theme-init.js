(() => {
  try {
    const stored = localStorage.getItem("ruum-theme");
    const validStored = stored === "light" || stored === "dark" ? stored : null;
    const theme = validStored ?? "light";
    document.documentElement.setAttribute("data-theme", theme);
  } catch {
    document.documentElement.setAttribute("data-theme", "light");
  }
})();
