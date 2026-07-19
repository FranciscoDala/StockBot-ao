forçar logout no console do navegador

document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/");
});
location.href = "/login"
