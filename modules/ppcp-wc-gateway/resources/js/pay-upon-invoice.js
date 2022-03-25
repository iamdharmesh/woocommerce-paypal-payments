window.addEventListener('load', function() {
    setTimeout(() => {
        const fncls = document.querySelector("[fncls='fnparams-dede7cc5-15fd-4c75-a9f4-36c430ee3a99']");
        const fncls_params = JSON.parse(fncls.textContent);

        const fraudnetSessionId = document.createElement('input');
        fraudnetSessionId.setAttribute('type', 'hidden');
        fraudnetSessionId.setAttribute('name', 'fraudnet-session-id');
        fraudnetSessionId.setAttribute('value', fncls_params.f);

        const form = document.querySelector('form.checkout');
        form.appendChild(fraudnetSessionId);

        console.log(fncls_params.f)
    }, 3000)
})

