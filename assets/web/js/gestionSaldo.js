let userCryptocurrencies = [];

window.onload = async function () {
    verifyToken().then(async () => {
        const token = await getToken();
        if (!token) {
            window.location.href = '/frontend/html/login.html';
        } else {
            await displayPortfolioValueChart();
            fetchCryptocurrencies().then(data => {
                displayCryptocurrencies(data);
                updateTotalBalance();
            });
            fetchUserCryptocurrencies().then(data => {
                userCryptocurrencies = data;
                displayUserCryptocurrencies(data);
                displayExchangeTokens();
                displayCryptoDistributionChart();
            });
            await loadSendCryptoOptions();
            preventNegativeInputs();
        }
    });
};

document.getElementById('showConfirmExchangeModalButton').addEventListener('click', async function () {
    try {
        const amount = parseFloat(document.getElementById('exchangeAmount').value);
        const fromTokenSelect = document.getElementById('fromTokenSelect');
        const toTokenSelect = document.getElementById('toTokenSelect');
        let fromTokenUid = fromTokenSelect.options[fromTokenSelect.selectedIndex].getAttribute('data-uid');
        let toTokenUid = toTokenSelect.options[toTokenSelect.selectedIndex].getAttribute('data-uid');
        const fromTokenAmount = userCryptocurrencies.find(crypto => crypto.uid === fromTokenUid)?.amount || 0;
        const eurBalance = parseFloat(document.getElementById('eurAmount').textContent);

        if (!fromTokenUid) {
            fromTokenUid = fromTokenSelect.value;
        }
        if (!toTokenUid) {
            toTokenUid = toTokenSelect.value;
        }

        // Comprobaciones antes de navegar al siguiente modal
        if (amount <= 0) {
            throw new Error('La cantidad debe ser mayor que 0.');
        }

        if (fromTokenUid === 'EUR' && eurBalance <= 0) {
            throw new Error('No tienes suficiente saldo en EUR.');
        }

        if (fromTokenUid === 'EUR' && eurBalance < amount) {
            throw new Error('Insufficient EUR balance.');
        }

        if (fromTokenUid !== 'EUR' && fromTokenAmount < amount) {
            throw new Error('Insufficient token balance.');
        }

        if (fromTokenUid !== 'EUR' && fromTokenAmount <= 0) {
            throw new Error('No tienes suficiente saldo en el token seleccionado.');
        }

        // Comprobación adicional para evitar el intercambio de 'EUR' a 'EUR'
        if (fromTokenUid === 'EUR' && toTokenUid === 'EUR') {
            correcto = false;
            $('#exchangeModal').modal('hide'); // Cerrar el modal
            document.getElementById('exchangeAmount').value = "";
            throw new Error('No puedes intercambiar EUR por EUR.');
        }

        const exchangeInfo = await confirmExchange(fromTokenUid, toTokenUid, amount);

        document.getElementById('confirmFromToken').textContent = fromTokenSelect.options[fromTokenSelect.selectedIndex].symbol;
        document.getElementById('confirmToToken').textContent = toTokenSelect.options[toTokenSelect.selectedIndex].symbol;
        document.getElementById('confirmExchangeRate').textContent = `${exchangeInfo.exchangeRate.toFixed(8)} ${toTokenUid === 'EUR' ? 'EUR' : toTokenSelect.options[toTokenSelect.selectedIndex].symbol}`;
        document.getElementById('confirmExchangedAmount').textContent = `${exchangeInfo.exchangedAmount.toFixed(8)} ${toTokenUid === 'EUR' ? 'EUR' : toTokenSelect.options[toTokenSelect.selectedIndex].symbol}`;

        $('#confirmExchangeModal').modal({
            backdrop: 'static',
            keyboard: false
        }).modal('show');

        startCountdown(30, fromTokenUid, toTokenUid, amount, exchangeInfo.exchangedAmount);
    } catch (error) {
        console.error('Error confirming exchange:', error);
        alert('There was an error confirming the exchange. Please try again. ' + error.message);
    }
});

// async function confirmExchange(fromTokenUid, toTokenUid, amount) {
//     const response = await fetch('/api/crypto/exchange', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${localStorage.getItem('token')}`
//         },
//         body: JSON.stringify({fromToken: fromTokenUid, toToken: toTokenUid, amount})
//     });
//
//     if (!response.ok) {
//         throw new Error('Failed to confirm exchange');
//     }
//
//     return await response.json();
// }


document.getElementById('buyModal').querySelector('.btn-primary').addEventListener('click', async function () {
    const buyAmount = parseFloat(document.getElementById('buyAmount').value);
    const currentEuroBalance = parseFloat(document.getElementById('eurAmount').innerText);
    const newEuroBalance = currentEuroBalance + buyAmount;
    document.getElementById('eurAmount').innerText = newEuroBalance.toFixed(2);
    document.getElementById('buyAmount').value = "";
    $('#buyModal').modal('hide');
    await updateTotalBalance();
});

// function displayCryptocurrencies(cryptocurrencies) {
//     const dataListElement = document.getElementById('cryptocurrenciesDataList');
//     cryptocurrencies.forEach(crypto => {
//         const optionElement = document.createElement('option');
//         optionElement.value = crypto.name;
//         dataListElement.appendChild(optionElement);
//     });
// }
// async function displayCryptocurrencies(cryptocurrencies) {
//     const selectElement = document.getElementById('cryptocurrencySelect');
//     cryptocurrencies.forEach(crypto => {
//         const userCrypto = userCryptocurrencies.find(userCrypto => userCrypto.name === crypto.name);
//         if (!userCrypto) {
//             const optionElement = document.createElement('option');
//             optionElement.value = crypto.uid;
//             optionElement.textContent = crypto.name;
//             selectElement.appendChild(optionElement);
//         }
//     });
// }

async function displayCryptocurrencies(cryptocurrencies) {
    const selectElement = document.getElementById('cryptocurrencySelect');
    selectElement.innerHTML = '';

    if (!userCryptocurrencies) {
        userCryptocurrencies = await fetchUserCryptocurrencies();
    }

    cryptocurrencies.forEach(crypto => {
        const userCrypto = userCryptocurrencies.find(userCrypto => userCrypto.name === crypto.name);
        if (!userCrypto) {
            const optionElement = document.createElement('option');
            optionElement.value = crypto.uid;
            optionElement.textContent = crypto.name;
            selectElement.appendChild(optionElement);
        }
    });
}


// async function addCryptocurrencyAutomatically(cryptocurrency) {
//     const token = await getToken();
//     try {
//         const response = await fetch('/api/settings/getSettings', {
//             method: 'GET',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer ${token}`
//             }
//         });
//         if (response.ok) {
//             const settings = await response.json();
//             if (settings.addCryptoAutomatically) {
//                 await addCryptocurrencyToPortfolio(cryptocurrency.uid);
//             }
//         } else {
//             console.error('Failed to load settings');
//         }
//     } catch (error) {
//         console.error('Error loading settings:', error);
//     }
// }

async function fetchCryptocurrencies() {
    const token = await getToken()
    const response = await fetch('/api/crypto/cryptocurrencies', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });

    if (response.ok) {
        const data = await response.json();
        return data.map(crypto => ({
            name: crypto.name,
            symbol: crypto.symbol,
            uid: crypto.uid
        }));
    } else {
        console.error('Failed to fetch cryptocurrencies');
        return [];
    }
}


async function fetchUserCryptocurrencies() {
    const token = await getToken()
    const response = await fetch('/api/crypto', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });

    if (response.ok) {
        const data = await response.json();
        return data;
    } else {
        console.error('Failed to fetch user cryptocurrencies');
        return [];
    }
}

async function addCryptocurrencyToPortfolio() {
    const selectElement = document.getElementById('cryptocurrencySelect');
    if (selectElement) {
        const selectedCryptocurrencyUid = selectElement.value;
        const token = await getToken()
        // Hacemos una solicitud al backend para obtener la criptomoneda por su uid
        const response = await fetch(`/api/crypto/cryptocurrencies`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({uid: selectedCryptocurrencyUid})
        });


        if (response.ok) {
            const selectedCryptocurrency = await response.json();

            const addResponse = await fetch('/api/crypto', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    uid: selectedCryptocurrency.uid, // Incluir uid en el cuerpo de la solicitud
                    name: selectedCryptocurrency.name,
                    symbol: selectedCryptocurrency.symbol,
                    amount: 0 // Establecer la cantidad inicial en 0
                })
            });

            if (addResponse.ok) {
                // Actualizar las criptomonedas del usuario
                userCryptocurrencies = await fetchUserCryptocurrencies();
                await displayUserCryptocurrencies(userCryptocurrencies);
                await displayExchangeTokens();
            } else {
                console.error('Failed to add cryptocurrency to portfolio');
            }

            // Cerrar el modal y restablecer los campos
            $('#addTokenModal').modal('hide');
            selectElement.value = '';
        } else {
            console.error('Failed to fetch cryptocurrency');
        }
    } else {
        console.error('Element with id "cryptocurrencySelect" was not found');
    }
}


document.getElementById('confirmAddToken').addEventListener('click', addCryptocurrencyToPortfolio);

async function displayUserCryptocurrencies(userCryptocurrencies) {
    const container = document.getElementById('cryptoCardsContainer');
    container.innerHTML = '';

    const cryptoValues = await Promise.all(
        userCryptocurrencies.filter(crypto => crypto.amount >= 0).map(async crypto => {
            try {
                const valueInDollars = await fetchCryptoValue(crypto.uid);
                return {...crypto, valueInDollars: valueInDollars * crypto.amount};
            } catch (e) {
                console.error(`Error fetching value for ${crypto.name}:`, e.message);
                return {...crypto, valueInDollars: 0};
            }
        })
    );

    cryptoValues.sort((a, b) => b.valueInDollars - a.valueInDollars);

    cryptoValues.forEach(crypto => {
        const card = document.createElement('div');
        card.className = 'card crypto-card';

        const cardBody = document.createElement('div');
        cardBody.className = 'card-body';

        const title = document.createElement('h5');
        title.className = 'card-title';
        title.textContent = crypto.name;

        const subtitle = document.createElement('h6');
        subtitle.className = 'card-subtitle mb-2 text-muted';
        subtitle.textContent = crypto.symbol;

        const text = document.createElement('p');
        text.className = 'card-text';
        text.textContent = `Amount: ${crypto.amount.toFixed(8)} - Value: $${crypto.valueInDollars.toFixed(2)}`;

        cardBody.appendChild(title);
        cardBody.appendChild(subtitle);
        cardBody.appendChild(text);
        card.appendChild(cardBody);

        container.appendChild(card);
    });
}

async function displayExchangeTokens() {
    // Actualizar userCryptocurrencies
    userCryptocurrencies = await fetchUserCryptocurrencies();

    const fromSelectElement = document.getElementById('fromTokenSelect');
    const toSelectElement = document.getElementById('toTokenSelect');

    // Añadir EUR a fromSelectElement
    const eurOptionElement = document.createElement('option');
    eurOptionElement.value = 'EUR';
    eurOptionElement.textContent = 'EUR';
    eurOptionElement.setAttribute('data-uid', 'EUR');
    fromSelectElement.appendChild(eurOptionElement.cloneNode(true));

    userCryptocurrencies.forEach(crypto => {
        const optionElement = document.createElement('option');
        optionElement.value = crypto.symbol;
        optionElement.textContent = crypto.name;
        optionElement.setAttribute('data-uid', crypto.uid);
        fromSelectElement.appendChild(optionElement.cloneNode(true));
    });

    // Asignar el valor inicial a fromTokenSelect
    if (fromSelectElement.options.length > 0) {
        fromSelectElement.selectedIndex = 0;
    }

    // Actualizar las opciones de toTokenSelect basadas en la selección inicial de fromTokenSelect
    const initialFromToken = fromSelectElement.options[fromSelectElement.selectedIndex].getAttribute('data-uid');
    updateToTokenOptions(initialFromToken, toSelectElement);

    // Añadir event listeners para actualizar las opciones cuando se selecciona una opción
    fromSelectElement.addEventListener('change', function () {
        const selectedFromToken = this.options[this.selectedIndex].getAttribute('data-uid');
        const selectedToToken = toSelectElement.options[toSelectElement.selectedIndex].getAttribute('data-uid');
        if (selectedFromToken === selectedToToken) {
            updateToTokenOptions(selectedFromToken, toSelectElement);
        }
    });

    toSelectElement.addEventListener('change', function () {
        const selectedToToken = this.options[this.selectedIndex].getAttribute('data-uid');
        const selectedFromToken = fromSelectElement.options[fromSelectElement.selectedIndex].getAttribute('data-uid');
        if (selectedToToken === selectedFromToken) {
            updateFromTokenOptions(selectedToToken, fromSelectElement);
        }
    });
}

function updateToTokenOptions(selectedFromToken, toSelectElement) {
    // Eliminar todas las opciones actuales
    toSelectElement.innerHTML = '';

    // Añadir todas las criptomonedas que no sean el token seleccionado en "From Token"
    userCryptocurrencies.forEach(crypto => {
        if (crypto.uid !== selectedFromToken) {
            const optionElement = document.createElement('option');
            optionElement.value = crypto.symbol;
            optionElement.textContent = crypto.name;
            optionElement.setAttribute('data-uid', crypto.uid);
            toSelectElement.appendChild(optionElement);
        }
    });

    // // Añadir EUR si no es el token seleccionado en "From Token"
    // if (selectedFromToken !== 'EUR') {
    //     const eurOptionElement = document.createElement('option');
    //     eurOptionElement.value = 'EUR';
    //     eurOptionElement.textContent = 'EUR';
    //     eurOptionElement.setAttribute('data-uid', 'EUR');
    //     toSelectElement.appendChild(eurOptionElement);
    // }
}

function updateFromTokenOptions(selectedToToken, fromSelectElement) {
    // Eliminar todas las opciones actuales
    fromSelectElement.innerHTML = '';

    // Añadir todas las criptomonedas que no sean el token seleccionado en "To Token"
    userCryptocurrencies.forEach(crypto => {
        if (crypto.uid !== selectedToToken) {
            const optionElement = document.createElement('option');
            optionElement.value = crypto.symbol;
            optionElement.textContent = crypto.name;
            optionElement.setAttribute('data-uid', crypto.uid);
            fromSelectElement.appendChild(optionElement);
        }
    });

    // Añadir EUR si no es el token seleccionado en "To Token"
    if (selectedToToken !== 'EUR') {
        const eurOptionElement = document.createElement('option');
        eurOptionElement.value = 'EUR';
        eurOptionElement.textContent = 'EUR';
        eurOptionElement.setAttribute('data-uid', 'EUR');
        fromSelectElement.appendChild(eurOptionElement);
    }
}

async function verifyToken() {
    const token = await getToken()
    const response = await fetch('/api/auth/verifyToken', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });

    if (response.ok) {
        const data = await response.json();
        if (!data.valid) {
            // Si el token no es válido, redirigir al usuario a la página de inicio de sesión
            window.location.href = '/frontend/html/login.html';
        }
    } else {
        window.location.href = '/frontend/html/login.html';
        console.error('Failed to verify token');
    }
}


async function confirmExchange(fromTokenUid, toTokenUid, amount) {
    const token = await getToken()
    const response = await fetch(`/api/transactions/exchange`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({fromToken: fromTokenUid, toToken: toTokenUid, amount})
    });

    if (response.ok) {
        const exchangeInfo = await response.json();
        displayExchangeModal();
        return exchangeInfo; // Devuelve exchangeInfo
    } else {
        console.error('Error during exchange request');
    }
}


async function finalizeExchange() {
    const finalize = async function () {
        let fromTokenUid = document.getElementById('fromTokenSelect').options[document.getElementById('fromTokenSelect').selectedIndex].getAttribute('data-uid');
        let toTokenUid = document.getElementById('toTokenSelect').options[document.getElementById('toTokenSelect').selectedIndex].getAttribute('data-uid');
        const exchangedAmountElement = document.getElementById('confirmExchangedAmount');

        if (!fromTokenUid) {
            fromTokenUid = "EUR";
        }
        if (!toTokenUid) {
            toTokenUid = "EUR";
        }


        if (exchangedAmountElement) {
            const exchangedAmount = parseFloat(exchangedAmountElement.textContent);

            const token = await getToken()
            const response = await fetch(`/api/transactions/confirm`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    fromToken: fromTokenUid,
                    toToken: toTokenUid,
                    amount: parseFloat(document.getElementById('exchangeAmount').value),
                    exchangedAmount
                })
            });

            if (response.ok) {
                // Cerrar los modales
                $('#exchangeModal').modal('hide');
                $('#confirmExchangeModal').modal('hide');
                // Recargar la página
                location.reload();
            } else {
                console.error('Error during exchange confirmation');
            }
        } else {
            console.error('Element with id "exchangedAmount" was not found');
        }
    };

    if (document.readyState === "loading") {
        document.addEventListener('DOMContentLoaded', finalize);
    } else {
        await finalize();
    }
}

document.getElementById('confirmExchangeButton').addEventListener('click', async function () {
    await finalizeExchange();
    await updateTotalBalance();
});

async function displayExchangeModal() {
    // Asegúrate de que el DOM esté completamente cargado antes de intentar acceder a los elementos
    document.addEventListener('DOMContentLoaded', function () {
        let countdown = 30;
        const countdownElement = document.getElementById('countdown');
        const circleElement = document.querySelector('.progress-ring__circle');
        const radius = circleElement.r.baseVal.value;
        const circumference = 2 * Math.PI * radius;

        circleElement.style.strokeDasharray = `${circumference} ${circumference}`;
        circleElement.style.strokeDashoffset = `${circumference}`;

        const fromTokenSelect = document.getElementById('fromTokenSelect');
        const toTokenSelect = document.getElementById('toTokenSelect');

        let fromTokenUid = fromTokenSelect.options[fromTokenSelect.selectedIndex].getAttribute('data-uid');
        let toTokenUid = toTokenSelect.options[toTokenSelect.selectedIndex].getAttribute('data-uid');

        // Obtener los nombres de los tokens
        let fromTokenName = fromTokenSelect.options[fromTokenSelect.selectedIndex].textContent;
        let toTokenName = toTokenSelect.options[toTokenSelect.selectedIndex].textContent;

        // Si el token es EUR, mostrar EUR; de lo contrario, mostrar el nombre del token
        const confirmFromTokenElement = document.getElementById('confirmFromToken');
        const confirmToTokenElement = document.getElementById('confirmToToken');

        if (fromTokenUid === 'EUR') {
            confirmFromTokenElement.textContent = 'EUR';
        } else {
            confirmFromTokenElement.textContent = fromTokenName;
        }

        if (toTokenUid === 'EUR') {
            confirmToTokenElement.textContent = 'EUR';
        } else {
            confirmToTokenElement.textContent = toTokenName;
        }

        // Mostrar el símbolo del token después del exchange rate
        const exchangeRateElement = document.getElementById('confirmExchangeRate');
        const exchangedAmountElement = document.getElementById('confirmExchangedAmount');

        // Asegúrate de que exchangeInfo esté definido
        const exchangeInfo = confirmExchange(fromTokenUid, toTokenUid, parseFloat(document.getElementById('exchangeAmount').value));

        exchangeRateElement.textContent = `${exchangeInfo.exchangeRate.toFixed(8)} ${toTokenUid === 'EUR' ? 'EUR' : toTokenSelect.options[toTokenSelect.selectedIndex].symbol}`;
        exchangedAmountElement.textContent = `${exchangeInfo.exchangedAmount.toFixed(8)} ${toTokenUid === 'EUR' ? 'EUR' : toTokenSelect.options[toTokenSelect.selectedIndex].symbol}`;

        document.getElementById('confirmExchangeContainer').style.display = 'block';
        document.getElementById('exchangeForm').style.display = 'none';

        $('#confirmExchangeModal').on('hidden.bs.modal', function () {
            clearInterval(countdownInterval);
        });
    });
}


document.querySelector('#confirmExchangeModal .close').addEventListener('click', function () {
    $('#confirmExchangeModal').modal('hide');
});

document.getElementById('cancelConfirmExchange').addEventListener('click', function () {
    $('#confirmExchangeModal').modal('hide');
});

let countdownInterval;
let exchangeInterval;

async function startCountdown(duration, fromToken, toToken, amount) {
    let countdown = duration;
    const countdownElement = document.getElementById('countdown');
    const circleElement = document.querySelector('.progress-ring__circle');
    const radius = circleElement.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;

    circleElement.style.strokeDasharray = `${circumference} ${circumference}`;
    circleElement.style.strokeDashoffset = `${circumference}`;

    clearInterval(countdownInterval);
    countdownInterval = setInterval(async () => {
        countdownElement.textContent = countdown;
        const offset = circumference - (countdown / duration) * circumference;
        circleElement.style.strokeDashoffset = offset;

        if (countdown <= 0) {
            clearInterval(countdownInterval);
            await updateExchangeRates(fromToken, toToken, amount);
            startCountdown(duration, fromToken, toToken, amount);
        } else {
            countdown--;
        }
    }, 1000);
}


async function updateExchangeRates(fromToken, toToken, amount) {
    const token = await getToken();
    try {
        const response = await fetch('/api/transactions/exchange', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({fromToken, toToken, amount})
        });

        if (response.ok) {
            const data = await response.json();

            const fromTokenSelect = document.getElementById('fromTokenSelect');
            const toTokenSelect = document.getElementById('toTokenSelect');

            let fromTokenName = fromTokenSelect.options[fromTokenSelect.selectedIndex].textContent;
            let toTokenName = toTokenSelect.options[toTokenSelect.selectedIndex].textContent;

            const confirmFromTokenElement = document.getElementById('confirmFromToken');
            const confirmToTokenElement = document.getElementById('confirmToToken');

            if (fromToken === 'EUR') {
                confirmFromTokenElement.textContent = 'EUR';
            } else {
                confirmFromTokenElement.textContent = fromTokenName;
            }

            if (toToken === 'EUR') {
                confirmToTokenElement.textContent = 'EUR';
            } else {
                confirmToTokenElement.textContent = toTokenName;
            }

            document.getElementById('confirmExchangeRate').textContent = `${data.exchangeRate.toFixed(8)} ${toToken === 'EUR' ? 'EUR' : toTokenSelect.options[toTokenSelect.selectedIndex].symbol}`;
            document.getElementById('confirmExchangedAmount').textContent = `${data.exchangedAmount.toFixed(8)} ${toToken === 'EUR' ? 'EUR' : toTokenSelect.options[toTokenSelect.selectedIndex].symbol}`;
        } else {
            console.error('Failed to update exchange rates');
        }
    } catch (error) {
        console.error('Error updating exchange rates:', error);
    }
}


// document.getElementById('showConfirmExchangeModalButton').addEventListener('click', () => {
//     startCountdown(30); // Iniciar el temporizador de 30 segundos
//     $('#confirmExchangeModal').modal('show');
// });

document.getElementById('confirmExchangeModal').addEventListener('hidden.bs.modal', () => {
    clearInterval(countdownInterval);
});

// function startCountdown(duration) {
//     let countdown = duration;
//     const countdownElement = document.getElementById('countdown');
//     const circleElement = document.querySelector('.progress-ring__circle');
//     const radius = circleElement.r.baseVal.value;
//     const circumference = 2 * Math.PI * radius;
//
//     circleElement.style.strokeDasharray = `${circumference} ${circumference}`;
//     circleElement.style.strokeDashoffset = `${circumference}`;
//
//     clearInterval(countdownInterval);
//
//     countdownInterval = setInterval(() => {
//         countdown--;
//         countdownElement.textContent = countdown;
//
//         const offset = circumference - (countdown / duration) * circumference;
//         circleElement.style.strokeDashoffset = offset;
//
//         if (countdown <= 0) {
//             countdown = duration;
//             circleElement.style.strokeDashoffset = `${circumference}`;
//         }
//     }, 1000);
// }
async function updateTotalBalance() {
    const token = await getToken();
    const response = await fetch('/api/crypto', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });

    if (response.ok) {
        const userCryptos = await response.json();
        let totalBalance = 0;

        for (const crypto of userCryptos) {
            if (crypto.symbol === 'EUR') {
                totalBalance += crypto.amount * 1.09; // Asegúrate de que este cálculo sea correcto
            } else {
                const cryptoValue = await fetchCryptoValue(crypto.uid);
                totalBalance += crypto.amount * cryptoValue;
            }
        }

        // Guardar el balance en la base de datos
        const updateResponse = await fetch('/api/users/updateBalance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({balance: totalBalance.toFixed(2)})
        });

        if (updateResponse.ok) {
            document.getElementById('totalBalance').innerText = totalBalance.toFixed(4);
        } else {
            console.error('Failed to update balance in the database');
        }
    } else {
        console.error('Failed to fetch user cryptocurrencies');
    }
}

const fetchPromises = {};

async function fetchCryptoValue(uid) {
    const sessionKey = `cryptoValue_${uid}`;
    const cachedData = sessionStorage.getItem(sessionKey);

    if (cachedData) {
        const {price, timestamp} = JSON.parse(cachedData);
        const now = Date.now();
        if (now - timestamp < 5 * 60 * 1000) {
            return parseFloat(price);
        }
    }

    if (fetchPromises[uid]) {
        return fetchPromises[uid];
    }

    const token = await getToken();

    fetchPromises[uid] = fetch(`/api/crypto/cryptocurrencies`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
        body: JSON.stringify({uid})
    }).then(async response => {
        if (response.status === 429) { // Manejar específicamente error 429
            throw new Error('API rate limit exceeded. Please wait.');
        }
        if (!response.ok) throw new Error('Failed to fetch cryptocurrency value');

        const data = await response.json();
        const priceData = {price: data.price, timestamp: Date.now()};
        sessionStorage.setItem(sessionKey, JSON.stringify(priceData));
        delete fetchPromises[uid];
        return data.price;

    }).catch(error => {
        delete fetchPromises[uid];
        console.error(error.message);
        throw error;
    });

    return fetchPromises[uid];
}


async function getToken() {
    try {
        const response = await fetch('/api/auth/token', {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Failed to fetch token');
        }

        const {token} = await response.json();
        return token;
    } catch (error) {
        console.error('Error fetching token:', error);
        window.location.href = '/frontend/html/login.html';
    }
}

async function fetchUserTransactions(filterType = '', filterValue = '') {
    const token = await getToken();
    const params = new URLSearchParams();
    if (filterType && filterValue) params.append('filterType', filterType);
    if (filterValue) params.append('filterValue', filterValue);

    const response = await fetch(`/api/transactions/user-transactions?${params.toString()}`, {
        headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`}
    });

    if (response.ok) {
        const data = await response.json();
        return data;
    } else {
        console.error('Failed to fetch transactions');
        return [];
    }
}

let currentFilterType = ''; // Variable global para guardar el filtro actual seleccionado

// Listener para seleccionar filtro desde dropdown
// Unificar los listeners para los elementos del dropdown
document.querySelectorAll('#filterDropdownButton + .dropdown-menu .dropdown-item').forEach(item => {
    item.addEventListener('click', function () {
        // Obtener el tipo de filtro seleccionado
        currentFilterType = this.getAttribute('data-filter');

        // Mostrar u ocultar los inputs según el tipo de filtro
        if (currentFilterType === 'date') {
            document.getElementById('transactionSearch').style.display = 'none';
            document.getElementById('transactionDate').style.display = 'block';
        } else {
            document.getElementById('transactionDate').style.display = 'none';
            document.getElementById('transactionSearch').style.display = 'block';
        }

        // Actualizar el texto del botón del dropdown
        document.getElementById('filterDropdownButton').innerHTML = `<i class="fas fa-filter"></i> ${this.textContent}`;
    });
});


async function displayUserTransactions(filterType = '', filterValue = '') {
    const transactions = await fetchUserTransactions(filterType, filterValue);
    const container = document.getElementById('transactionsContainer');
    container.innerHTML = '';

    for (const transaction of transactions) {
        const transactionElement = document.createElement('tr');

        const date = transaction.date ? new Date(transaction.date).toLocaleDateString('es-ES') : '';
        const userFromName = transaction.userFrom?.username || '';
        const userToName = transaction.userTo?.username || '';
        const userFromAddress = transaction.userFrom?.publicAddress || '';
        const userToAddress = transaction.userTo?.publicAddress || '';

        // Determinar tipo según si remitente y receptor son iguales
        const transactionType =
            transaction.userFrom?._id === transaction.userTo?._id ? 'exchange' : 'send';

        transactionElement.innerHTML += `
            <td>${transaction.hash}</td>
            <td class="user-tooltip" data-address="${userFromAddress}">${userFromName}</td>
            <td class="user-tooltip" data-address="${userToAddress}">${userToName}</td>
            <td>${transaction.symbol}</td>
            <td>${transaction.toToken || ''}</td>
            <td>${transaction.fromAmount}</td>
            <td>${transaction.toAmount}</td>
            <td>${date}</td>
            <td>${transactionType}</td>
        `;

        container.appendChild(transactionElement);
    }

    // Añadir tooltips y copiar al portapapeles
    document.querySelectorAll('.user-tooltip').forEach(element => {
        element.title = 'Pulsa para copiar publicAddress';
        element.onclick = () => navigator.clipboard.writeText(element.dataset.address).then(() => alert("Public address copiada"));
    });
}


const cryptoDataCache = {};

async function fetchCryptoData(uid) {
    if (cryptoDataCache[uid]) {
        return cryptoDataCache[uid];
    }

    const token = await getToken();
    const response = await fetch(`/api/crypto/cryptocurrencies/${uid}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (response.ok) {
        const data = await response.json();
        cryptoDataCache[uid] = data;
        return data;
    } else {
        console.error('Failed to fetch cryptocurrency data');
        return {symbol: uid};
    }
}

// document.getElementById('transactionsButton').addEventListener('click', async function () {
//     await displayUserTransactions();
//     $('#transactionsModal').modal('show');
// });

document.getElementById('transactionsButton').onclick = async () => {
    currentFilterType = '';
    document.getElementById('filterDropdownButton').innerHTML = `<i class="fas fa-filter"></i>`;
    document.getElementById('transactionSearch').value = '';
    await displayUserTransactions();
    $('#transactionsModal').modal('show');
};

// Variable to store the selected filter
let selectedFilter = 'hash';

// Event listener for filter selection
// document.querySelectorAll('.dropdown-item').forEach(item => {
//     item.addEventListener('click', function () {
//         selectedFilter = this.getAttribute('data-filter');
//         resetFilters(); // Reset filters when filter method changes
//         if (selectedFilter === 'date') {
//             document.getElementById('transactionSearch').style.display = 'none';
//             document.getElementById('transactionDate').style.display = 'block';
//         } else {
//             document.getElementById('transactionSearch').style.display = 'block';
//             document.getElementById('transactionDate').style.display = 'none';
//         }
//     });
// });

// Event listener for search input
// document.getElementById('transactionSearch').addEventListener('input', function () {
//     const searchTerm = this.value.toLowerCase();
//     const transactions = document.querySelectorAll('#transactionsContainer tr');
//
//     transactions.forEach(transaction => {
//         const filterText = transaction.querySelector(`td[data-filter="${selectedFilter}"]`).textContent.toLowerCase();
//         if (filterText.includes(searchTerm)) {
//             transaction.style.display = '';
//         } else {
//             transaction.style.display = 'none';
//         }
//     });
// });

document.getElementById('transactionSearch').addEventListener('input', async function () {
    if (currentFilterType) {
        await displayUserTransactions(currentFilterType, this.value.trim());
    }
});

document.getElementById('transactionDate').addEventListener('input', async function () {
    if (currentFilterType === 'date') {
        const isoDate = new Date(this.value.trim()).toISOString().split('T')[0];
        await displayUserTransactions(currentFilterType, isoDate);
    }
});


// Event listener for date input
// document.getElementById('transactionDate').addEventListener('input', function () {
//     const selectedDate = this.value;
//     const transactions = document.querySelectorAll('#transactionsContainer tr');
//
//     transactions.forEach(transaction => {
//         const transactionDate = transaction.querySelector(`td[data-filter="date"]`).textContent.split(' ')[0];
//         if (transactionDate === selectedDate) {
//             transaction.style.display = '';
//         } else {
//             transaction.style.display = 'none';
//         }
//     });
// });

// function resetFilters() {
//     const transactions = document.querySelectorAll('#transactionsContainer tr');
//     transactions.forEach(transaction => {
//         transaction.style.display = '';
//     });
//     document.getElementById('transactionSearch').value = '';
//     document.getElementById('transactionDate').value = '';
// }

async function loadSendCryptoOptions() {
    const userCryptocurrencies = await fetchUserCryptocurrencies();
    const sendCryptoSelect = document.getElementById('sendCryptoSelect');
    sendCryptoSelect.innerHTML = ''; // Limpiar las opciones existentes

    userCryptocurrencies.forEach(crypto => {
        const option = document.createElement('option');
        option.value = crypto.symbol;
        option.textContent = `${crypto.name} (${crypto.symbol})`;
        sendCryptoSelect.appendChild(option);
    });
}

$('#sendModal').on('show.bs.modal', function () {
    loadSendCryptoOptions();
});

document.getElementById('confirmSendToken').addEventListener('click', async function () {
    const token = await getToken();
    const symbol = document.getElementById('sendCryptoSelect').value;
    const amount = document.getElementById('sendAmount').value;
    const receiverAddress = document.getElementById('receiverAddress').value;

    // Obtener el uid y el nombre de la criptomoneda seleccionada
    const selectedCrypto = userCryptocurrencies.find(crypto => crypto.symbol === symbol);
    const uid = selectedCrypto ? selectedCrypto.uid : null;
    const name = selectedCrypto ? selectedCrypto.name : null;

    if (uid && name && symbol && amount && receiverAddress) {
        try {
            const response = await fetch('/api/transactions/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({uid, name, symbol, amount, receiverAddress})
            });

            if (response.ok) {
                const result = await response.json();
                alert('Transaction successful: ' + result.msg);
                $('#sendModal').modal('hide');
            } else {
                const errorData = await response.json();
                alert('Error: ' + errorData.msg);
            }
        } catch (err) {
            console.error('Failed to send token', err);
            alert('Failed to send token');
        }
    } else {
        alert('Please fill in all fields');
    }
});

async function displayCryptoDistributionChart() {
    const userCryptos = await fetchUserCryptocurrencies();
    const labels = [];
    const data = [];
    const backgroundColors = [];

    for (const crypto of userCryptos) {
        const cryptoValue = await fetchCryptoValue(crypto.uid);
        const valueInDollars = crypto.amount * cryptoValue;
        labels.push(crypto.name);
        data.push(valueInDollars);
        backgroundColors.push(`#${Math.floor(Math.random() * 16777215).toString(16)}`); // Color aleatorio
    }

    const ctx = document.getElementById('cryptoDistributionChart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        boxWidth: 20,
                        padding: 15,
                        font: {
                            size: 14
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (tooltipItem) {
                            const total = data.reduce((acc, value) => acc + value, 0);
                            const percentage = ((tooltipItem.raw / total) * 100).toFixed(2);
                            return `${tooltipItem.label}: $${tooltipItem.raw.toFixed(2)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function aggregatePortfolioValues(portfolioValues) {
    const aggregatedValues = {};

    portfolioValues.forEach(entry => {
        const date = entry.date.split('T')[0]; // Obtener solo la fecha en formato YYYY-MM-DD
        const value = parseFloat(entry.balance);

        if (aggregatedValues[date]) {
            aggregatedValues[date].sum += value;
            aggregatedValues[date].count += 1;
        } else {
            aggregatedValues[date] = {sum: value, count: 1};
        }
    });

    // Convertir el objeto de valores agregados en un array con promedio calculado
    return Object.keys(aggregatedValues).map(date => ({
        date: date,
        balance: (aggregatedValues[date].sum / aggregatedValues[date].count).toFixed(2) // Calcular el promedio
    }));
}


async function displayPortfolioValueChart() {
    const publicAddress = await getPublicAddress(); // Obtener publicAddress del usuario

    const response = await fetch(`/api/users/balanceHistory?publicAddress=${publicAddress}`, {
        method: 'GET',
        headers: {'Content-Type': 'application/json'},
    });

    if (response.ok) {
        const data = await response.json();

        // Ordenar datos por fecha
        data.sort((a, b) => new Date(a.date) - new Date(b.date));

        const ctx = document.getElementById('portfolioValueChart').getContext('2d');
        if (window.portfolioChart instanceof Chart) window.portfolioChart.destroy();

        window.portfolioChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(entry => entry.date),
                datasets: [{
                    label: 'Average Portfolio Value Over Time',
                    data: data.map(entry => entry.balance),
                    borderColor: 'rgba(75,192,192,1)',
                    backgroundColor: 'rgba(75,192,192,0.2)',
                    borderWidth: 2,
                    fill: true,
                }]
            },
            options: {
                scales: {
                    x: { // Configuración de la escala X
                        type: 'time', // Escala de tiempo
                        time: {unit: 'day'}, // Agrupación por días
                        adapters: {date: {locale: 'en-US'}}, // Opcional para configurar el idioma
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    },
                    y: { // Configuración de la escala Y
                        type: 'linear',
                        title: {
                            display: true,
                            text: 'Portfolio Value'
                        }
                    }
                }
            }
        });
    } else {
        console.error('Failed to fetch balance history');
    }
}


// Obtener publicAddress del usuario actual
async function getPublicAddress() {
    const response = await fetch('/api/users/me', {method: 'GET'}); // Suponiendo que tienes una ruta para obtener los datos del usuario actual
    if (response.ok) {
        const user = await response.json();
        return user.publicAddress;
    } else {
        throw new Error('Failed to fetch user public address');
    }
}


// async function fetchPortfolioValues() {
//     const token = await getToken(); // Obtener el token del usuario
//     const response = await fetch('/api/users/balanceHistory', {
//         method: 'GET',
//         headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${token}`
//         }
//     });
//
//     if (!response.ok) {
//         console.error('Failed to fetch portfolio values');
//         return [];
//     }
//
//     const balanceHistory = await response.json();
//     console.log("Balance History:", balanceHistory); // Verifica los datos obtenidos
//     return balanceHistory;
// }


document.getElementById('autoAddCrypto').addEventListener('change', async function () {
    const preference = this.checked;
    const token = await getToken();
    try {
        const response = await fetch('/api/settings/saveSettings', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({settings: {addCryptoAutomatically: preference}})
        });
        if (response.ok) {
            console.log('Settings saved successfully');
        } else {
            console.error('Failed to save settings');
        }
    } catch (error) {
        console.error('Error saving settings:', error);
    }
});

async function loadSettings() {
    const token = await getToken();
    try {
        const response = await fetch('/api/settings/getSettings', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        if (response.ok) {
            const settings = await response.json();
            document.getElementById('autoAddCrypto').checked = settings.addCryptoAutomatically;
        } else {
            console.error('Failed to load settings');
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// Llamar a loadSettings cuando se abran los ajustes
document.getElementById('settingsButton').addEventListener('click', async function () {
    await loadSettings();
    $('#settingsModal').modal('show');
});

function preventNegativeInputs() {
    const numericInputs = document.querySelectorAll('input[type="number"]');
    numericInputs.forEach(input => {
        input.setAttribute('min', '0');
        input.addEventListener('input', () => {
            if (parseFloat(input.value) < 0) input.value = '';
        });
    });
}
