// 'use strict';

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const inputs = [inputDistance, inputDuration, inputCadence, inputElevation];

class App {
    #map;
    #mapEvent;

    constructor() {
        this.#getPosition();
        form.addEventListener("submit", this.#newWorkout.bind(this));
        inputType.addEventListener("change", this.#togleElevationField);

    }

    #getPosition() {
        navigator.geolocation.getCurrentPosition(this.#loadMap.bind(this), function () {
            alert(`Could not get your position!`);
        })
    }

    #loadMap(position) {
        const { latitude, longitude } = position.coords;
        const coords = [latitude, longitude];
        // L.map('map') --> <div id="map">
        this.#map = L.map('map').setView(coords, 13);
        L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);

        this.#map.on("click", this.#showForm.bind(this));
    }

    #showForm(mapE) {
        this.#mapEvent = mapE;
        form.classList.remove("hidden");
        inputDistance.focus();
    }

    #togleElevationField() {
        inputCadence.closest("div").classList.toggle("form__row--hidden");
        inputElevation.closest("div").classList.toggle("form__row--hidden");
    }

    #newWorkout(e) {
        e.preventDefault();
        inputs.forEach(input => input.value = '');
        const { lat, lng } = this.#mapEvent.latlng;
        const newCoords = [lat, lng];
        const popupOptions = {
            maxWidth: 250,
            minWidth: 150,
            autoClose: false,
            closeOnClick: false,
            className: "running-popup"
        }
        L.marker(newCoords).addTo(this.#map)
            .bindPopup(L.popup(popupOptions))
            .setPopupContent("Workout..")
            .openPopup();
    }
}
const app = new App();




