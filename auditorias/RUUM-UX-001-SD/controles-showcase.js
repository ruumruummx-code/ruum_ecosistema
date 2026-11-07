// Host interactivo opcional. No se monta durante las pruebas base.
if (new URLSearchParams(location.search).has('interactive')) {
  const mount = () => {
    if (!window.auditRegistry) return setTimeout(mount, 30);
    const host = document.createElement('aside');
    host.setAttribute('aria-label', 'Selector de muestras de auditoría');
    const label = document.createElement('label');
    label.textContent = 'Componente y estado ';
    const select = document.createElement('select');
    for (const row of window.auditRegistry) {
      const option = document.createElement('option');
      option.value = row.id;
      option.textContent = row.component + ' · ' + row.state;
      select.append(option);
    }
    select.onchange = () => window.auditSelect(select.value);
    label.append(select);
    const themeLabel = document.createElement('label');
    themeLabel.textContent = ' Tema ';
    const theme = document.createElement('select');
    for (const value of ['light', 'dark']) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      theme.append(option);
    }
    theme.onchange = () => document.documentElement.dataset.theme = theme.value;
    themeLabel.append(theme);
    host.append(label, themeLabel);
    document.body.prepend(host);
  };
  mount();
}
