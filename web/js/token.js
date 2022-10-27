export function getInput({ storageKeys, form, inputs, saveCheckbox }) {
  const localStorageValues = {
    token: localStorage.getItem(storageKeys.token),
    port: localStorage.getItem(storageKeys.port),
  };
  if (localStorageValues) {
    inputs.token.value = localStorageValues.token;
    inputs.port.value = localStorageValues.port;
    saveCheckbox.checked = true;
  }
  saveCheckbox.addEventListener('change', (e) => {
    if (saveCheckbox.checked) {
      localStorage.setItem(storageKeys.token, inputs.token.value);
      localStorage.setItem(storageKeys.port, inputs.port.value);
    } else {
      localStorage.removeItem(storageKeys.token);
      localStorage.removeItem(storageKeys.port);
    }
  });
  return new Promise((resolve) => {
    form.addEventListener(
      'submit',
      (e) => {
        if (saveCheckbox.checked) {
          localStorage.setItem(storageKeys.token, inputs.token.value);
          localStorage.setItem(storageKeys.port, inputs.port.value);
        }
        resolve({
          token: inputs.token.value,
          port: inputs.port.value,
        });
        e.preventDefault();
      },
      { once: true }
    );
  });
}
