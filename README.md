## Initialization
```
yarn install
```

## Usage

Run Chrome browser with the following command:
```
google-chrome --remote-debugging-port=21222
```

Let it stay open and navigate to https://driverpracticaltest.dvsa.gov.uk/login. The page recognizes it's being loaded by a robot and asks to solve a captcha first. Captcha solving is not implemented and should be completed manually. After that browser session can be used for running a script:

```
node index.js
````

