fetch('https://dns.phazed.xyz/api/v1/a').then(data => data.text()).then(data => {
    console.log(data)
})