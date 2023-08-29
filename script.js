// 'use strict';

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];


class Workout {
    id = (new Date().getTime() + "").slice(-5);
    date = new Date();

    constructor(coords, distance, duration) {
        this.coords = coords;
        this.distance = distance; // km
        this.duration = duration; // min
    }
}

class Running extends Workout {
    type = "running";
    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;
        this.calcPace();
    }

    calcPace() {
        // min/km
        this.pace = (this.duration / this.distance).toFixed(2);
        return this.pace;
    }
}

class Cycling extends Workout {
    type = `cycling`;
    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;
        this.calcSpeed();
    }

    calcSpeed() {
        // km/hr
        this.speed = this.distance / (this.duration / 60);
        return this.speed;
    }
}
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
    #workouts = [];

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

        // Get data from form
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        // Used for a new Object(Cycling/Running) and L.marker
        const { lat, lng } = this.#mapEvent.latlng;
        // To access from the if-block scope
        let cadence, elevation, workout;
        // If workout is running, create running object
        if (type === `running`) {
            cadence = +inputCadence.value;
            if (!this.#validateInput(distance, duration, cadence)) return alert(`Provided input is invalid!`);
            workout = new Running([lat, lng], distance, duration, cadence);
        }
        // If workout is cycling, create running object
        else if (type === `cycling`) {
            elevation = +inputElevation.value;
            if (!this.#validateInput(distance, duration, elevation)) return alert(`Provided input is invalid!`);
            workout = new Cycling([lat, lng], distance, duration, elevation);
        }
        // Add new object to workout array
        this.#workouts.push(workout);
        // Render workout on the map as a marker with an attached pop-up
        this.#renderWorkoutMarker(workout);

        inputs.forEach(input => input.value = '');
    }

    #validateInput(...inputs) {
        return inputs.every(input => !isNaN(input) && input > 0);
    }

    #renderWorkoutMarker(workout) {
        const popupOptions = {
            maxWidth: 250,
            minWidth: 150,
            autoClose: false,
            closeOnClick: false,
            className: `${workout.type === 'cycling' ? 'cycling' : 'running'}-popup`
        }

        L.marker(workout.coords).addTo(this.#map)
            .bindPopup(L.popup(popupOptions))
            .setPopupContent("Workout..")
            .openPopup();
    }

}
const app = new App();


