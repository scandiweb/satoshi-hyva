![https://readymage.com/](https://user-images.githubusercontent.com/19326254/105317017-602cc400-5bca-11eb-88ae-63f10f7344a2.png)

## Welcome to your new repository! 🚀

We've prepared everything you will need to develop your own ScandiPWA theme for Magento 2! 
Start by creating new commits, and your changes will be automatically deployed to your website via [ReadyMage](https://portal.readymage.com/).


For additional details or questions regarding ReadyMage, feel free to browse our [help portal](https://help.readymage.com/).

## ScandiPWA

Created using:

![Create ScandiPWA App](https://user-images.githubusercontent.com/19326254/105321722-7f2e5480-5bd0-11eb-813f-e2c2fba85a31.png)

### Quick start

- Make sure that you have Node >= 12.20 on your local development machine
- Start it up by running:
    ```bash
    cd scandipwa
    npm ci
    BUILD_MODE=magento npm run start # Mac, Linux
    set BUILD_MODE=magento && npm run start & set BUILD_MODE= # Windows
    ```
- Explore all the [available commands](https://docs.create-scandipwa-app.com/deploying-your-app/magento-theme#npm-run-start-or-yarn-start).

## Magento 2

Created using:

![Create Magento App](https://user-images.githubusercontent.com/19326254/105321711-7b9acd80-5bd0-11eb-8c3a-bd96091b02ae.png)

### Quick start

- Make sure that you have Node >= 12.20 on your local development machine.
- Check that the [prerequisites](https://docs.create-magento-app.com/getting-started/prerequisites) have been installed.

- Start it up by running:   
    ```bash
    npm ci
    npm run start
    npm run link scandipwa
    ```
- Explore all the [available commands](https://docs.create-magento-app.com/getting-started/available-commands).


### Troubleshooting
- ```npm run start``` fails.
  - Read the error message, we give you helpful hints and solutions on what has gone wrong.
  - Try increasing php memory limit via phpbrew.
  - Try removing [composer memory limits](https://getcomposer.org/doc/articles/troubleshooting.md#memory-limit-errors).

