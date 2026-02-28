let logoutCallback = null;

export const setLogoutCallback = (cb) => {
  logoutCallback = cb;
};

export const handleUnauthorized = () => {
  if (logoutCallback) {
    logoutCallback();
  }
};
