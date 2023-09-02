const axios = require("axios");

function dl(url) {
  return new Promise((resolve, reject) => {
    axios({
      method: "get",
      url: url,
      responseType: "arraybuffer",
      timeout: 60000,
    })
      .then((response) => {
        if (response.data instanceof Buffer) {
          resolve(response.data);
        } else {
          const buffer = Buffer.from(response.data);
          resolve(buffer);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  });
}

module.exports = {
  dl,
};
