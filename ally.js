const fetch = require('node-fetch');
const imageToBase64 = require('image-to-base64');

(async() => {
    function sleep(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

    class dependencies {
        constructor() {
            //edit
            this.catchall = '@catchall.io'
            this.apiKey = '2cap_api_key'
            this.taskAmount = 50
        }

        sendRequest = async (url, method, body, headers) => {
                if (body != '') {
                    return new Promise(async (res, rej) => {
                        try {
                            const returnA = await fetch(url, {
                                method: method,
                                body: body,
                                headers: headers
                            })
                            res(returnA.text())
                        } catch {
                            res(null)
                        }
                    })
                } else {
                    return new Promise(async (res, rej) => {
                        try {
                            const returnA = await fetch(url, {
                                method: method,
                                headers: headers
                            })
                            res(returnA.text())
                        } catch {
                            res(null)
                        }
                    })
                }
        }
    }

    class taskFlow {
        async solveCaptcha(file) {
            const postJSON = {
                key: dependenciesClass.apiKey,
                method: 'base64',
                body: await imageToBase64(file)
            }
            let captchaResp = await dependenciesClass.sendRequest('http://2captcha.com/in.php', 'POST', JSON.stringify(postJSON), {'content-type': 'application/json'})
            captchaResp = captchaResp.split('|')[1]


            while (true) {
                let captcha = await dependenciesClass.sendRequest(`http://2captcha.com/res.php?key=${dependenciesClass.apiKey}&action=get&id=${captchaResp}`)
                if (captcha && captcha.includes('OK')) {
                    let finalCapt = captcha.split('|')[1]
                    return finalCapt
                }
                await sleep(5000)
            }
        }
        async getCaptcha() {
            let captchaDetails = JSON.parse(await dependenciesClass.sendRequest('https://allydigitaldollar.com/captcha/key', 'GET'))
            let captchaResponse = await this.solveCaptcha(captchaDetails.Result.ImagePath)
            //console.log(captchaResponse)
            this.createUser(captchaDetails.Result.Key, captchaResponse)
        }

        async createUser(key, value) {
            let email = Math.random().toString(36).substring(7)+dependenciesClass.catchall
            //console.log(email)
            const postJSON = {
                Email: email,
                AgreeToRules: true,
                Captcha: {
                    Key: key,
                    Value: value
                },
                ReferringUserGuid: null,
                ReferringSource: 'link'
            }

            let resp = JSON.parse(await dependenciesClass.sendRequest('https://allydigitaldollar.com/user/create', 'POST', JSON.stringify(postJSON), {'content-type': 'application/json'}))
            try {
                if (resp.Result.IsRegistered) {
                    //console.log('Successfully Made User: '+email)
                    this.createPlayID(email)
                } else {
                    console.log(resp)
                }
            } catch {
                this.getCaptcha()
                return
            }
        }

        async createPlayID(email) {
            const postJSON = {
                email: email
            }
            let idResponse = JSON.parse(await dependenciesClass.sendRequest('https://allydigitaldollar.com/user/id', 'POST', JSON.stringify(postJSON), {'content-type': 'application/json'}))
            if (idResponse.Result.Id) {
                this.checkWin(idResponse.Result.Id)
            } else {
                console.log(idResponse)
            }
        }

        async checkWin(id) {
            const winResponse = JSON.parse(await dependenciesClass.sendRequest(`https://allydigitaldollar.com/instantwin/${id}/play`, 'GET'))
            if (winResponse.Result.Winner) {
                console.log('---------WINNER: '+winResponse.Result.PrizeDetails.Name)
                this.verifyWin(id, winResponse.Result.ConfirmationId)
            } else if (winResponse.Result.Winner == false) {
                console.log('Loser')
                this.getCaptcha()
                return
            } else {
                console.log(winResponse)
                return
            }
        }

        async verifyWin(id, conf) {
            const winResponse = JSON.parse(await dependenciesClass.sendRequest(`https://allydigitaldollar.com/instantwin/${id}/result/${conf}`, 'GET'))
            if (winResponse.Result.Notified) {
                console.log('Successfully Notified')
            }
        }
    }
    const dependenciesClass = new dependencies()
    const taskFlowClass = new taskFlow()
    for (let i = 0; dependenciesClass.taskAmount > i; i++) {
        console.log(i)
        taskFlowClass.getCaptcha()
    }

})()