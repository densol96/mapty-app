// 'use strict';

class Workout {
    id = (new Date().getTime() + "").slice(-5);
    date = new Date();
    months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    constructor(coords, distance, duration) {
        this.coords = coords;
        this.distance = distance; // km
        this.duration = duration; // min
    }

    // For the Child classes to Inherit this method
    _setDescription() {
        const firstLetter = this.type[0].toUpperCase();
        const theRest = this.type.slice(1);
        const monthString = this.months[this.date.getMonth()];
        const dayDate = this.date.getDate();
        this.description = `${firstLetter + theRest} on ${monthString} ${dayDate}`;
    }

    test() {
        console.log(`Hello!`);
    }
}

class Running extends Workout {
    type = "running";

    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;
        this.calcPace();
        this._setDescription();
    }

    calcPace() {
        // min/km
        this.pace = (this.duration / this.distance).toFixed(2);
        return this.pace;
    }
}

class Cycling extends Workout {
    type = `cycling`;

    constructor(coords, distance, duration, elevation) {
        super(coords, distance, duration);
        this.elevation = elevation;
        this.calcSpeed();
        this._setDescription();
    }

    calcSpeed() {
        // km/hr
        this.speed = (this.distance / (this.duration / 60)).toFixed(2);
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
    #mapZoom = 13;
    #mapEvent;
    #workouts = [];
    #popUpCash = {};

    constructor() {
        // Get user's position
        this.#getPosition();
        // Get data from local storage
        this.#getLocalStorage();

        // Attach event handlers
        form.addEventListener("submit", this.#newWorkout.bind(this));
        inputType.addEventListener("change", this.#togleElevationField);
        containerWorkouts.addEventListener("click", this.#moveToPopUp.bind(this));
        containerWorkouts.addEventListener("click", this.#removeRecord.bind(this));
        containerWorkouts.addEventListener("click", this.#editRecord.bind(this));
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
        this.#map = L.map('map').setView(coords, this.#mapZoom);
        L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);

        this.#map.on("click", this.#showForm.bind(this));

        this.#workouts.forEach(workout => {
            this.#renderWorkoutMarker(workout);
        });
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
        // Render workout as a part of the list on the left
        this.#renderWorkout(workout);
        // Hide the form + clean input fields
        this.#closeForm();
        // Set local storage to all workouts
        this.#setLocalStorage();

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

        const marker = L.marker(workout.coords).addTo(this.#map);
        marker.bindPopup(L.popup(popupOptions))
            .setPopupContent(`${workout.type === 'cycling' ? '🚴‍♀️' : '🏃‍♂️'}` + workout.description)
            .openPopup();

        this.#popUpCash[workout.id] = marker;
    }

    #renderWorkout(workout) {

        const type = workout.type;

        const htmlMain = `<li class="workout workout--${type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}
          <button class="edit">Edit</button>
          <button class="remove">Remove</button>
          </h2>
          <div class="workout__details">
            <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div >
            <div class="workout__details">
                <span class="workout__icon">⏱</span>
                <span class="workout__value">${workout.duration}</span>
                <span class="workout__unit">min</span>
            </div>`;

        let htmlAdd;
        if (workout.type === "running") {
            htmlAdd = `<div class="workout__details" >
                        <span class="workout__icon">⚡️</span>
                        <span class="workout__value">${workout.pace}</span>
                        <span class="workout__unit">min/km</span>
                    </div >
                    <div class="workout__details">
                        <span class="workout__icon">🦶🏼</span>
                        <span class="workout__value">${workout.cadence}</span>
                        <span class="workout__unit">spm</span>
                    </div>
                </li > `
        } else {
            htmlAdd = `<div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.speed}</span>
                <span class="workout__unit">km/h</span>
                </div >
                <div class="workout__details">
                    <span class="workout__icon">⛰</span>
                    <span class="workout__value">${workout.elevation}</span>
                    <span class="workout__unit">m</span>
                </div>
            </li > `
        }

        const html = htmlMain + htmlAdd;
        form.insertAdjacentHTML("afterend", html);
    }

    #closeForm() {
        form.style.display = "none";
        form.classList.add("hidden");
        setTimeout(() => form.style.display = "grid", 1000);
        inputs.forEach(input => input.value = '');
    }

    #moveToPopUp(e) {
        const workoutEl = e.target.closest(".workout");
        if (!workoutEl || e.target.classList.contains("remove")) return;
        form.classList.add("hidden");
        const workout = this.#workouts.find(el => el.id === workoutEl.dataset.id);
        this.#map.setView(workout.coords, this.#mapZoom, {
            animate: true,
            pan: {
                duation: 1
            }
        });
    }

    #removeRecord(e) {
        const removeBtn = e.target.closest(".remove");
        if (!removeBtn) return;
        const htmlRemElement = removeBtn.closest("li.workout");
        const confirm = window.confirm(`Are you sure you want to remove the workout with id=${htmlRemElement.dataset.id}`)
        if (confirm) {
            htmlRemElement.remove();
            const workout = this.#workouts.find(workout => workout.id === htmlRemElement.dataset.id);
            const index = this.#workouts.indexOf(workout);
            this.#map.removeLayer(this.#popUpCash[workout.id]);
            this.#workouts.splice(index, 1);
            this.#setLocalStorage();
        }
    }

    #editRecord(e) {
        const editBtn = e.target.closest(".edit");
        if (!editBtn) return;
        const htmlBtnEl = editBtn.closest("li.workout");
        const workout = this.#workouts.find(workout => workout.id === htmlBtnEl.dataset.id);
        const newDistance = +prompt("Enter new distance:");
        if (!newDistance) return;
        const newDuration = +prompt("Enter new duration:");
        if (!newDuration) return;
        let newCadence, newElevation;
        let isRun = false;

        if (htmlBtnEl.classList.contains("workout--running")) {
            newCadence = +prompt("Enter new cadence:");
            if (!this.#validateInput(newDistance, newDuration, newCadence)) return alert(`Provided input is invalid!`);
            workout.cadence = newCadence;
            isRun = true;
        } else {
            newElevation = +prompt("Enter new elevation:");
            if (!this.#validateInput(newDistance, newDuration, newElevation)) return alert(`Provided input is invalid!`);
            workout.elevation = newElevation;
        }
        workout.distance = +newDistance;
        workout.duration = +newDuration;

        const fields = htmlBtnEl.querySelectorAll(".workout__value");

        fields[0].textContent = workout.distance;
        fields[1].textContent = workout.duration;
        if (isRun) {
            workout.calcPace();
            fields[2].textContent = workout.pace;
            fields[3].textContent = workout.cadence;
        } else {
            workout.calcSpeed();
            fields[2].textContent = workout.speed;
            fields[3].textContent = workout.elevation;
        }
        this.#setLocalStorage();
    }

    #setLocalStorage() {
        localStorage.setItem("workouts", JSON.stringify(this.#workouts));
    }

    #getLocalStorage() {
        const data = localStorage.getItem("workouts");
        if (!data) return;

        this.#workouts = JSON.parse(data);
        this.#workouts.forEach(workout => {
            this.#renderWorkout(workout);
            if (workout.type === "cycling") {
                workout.__proto__ = Cycling.prototype;
            } else if (workout.type === "running") {
                workout.__proto__ = Running.prototype;
            }
        });
    }

    reset() {
        localStorage.removeItem("workouts");
        location.reload();
    }

}
const app = new App();