document.addEventListener("DOMContentLoaded", () => {

    const counters = document.querySelectorAll(".counter");

    counters.forEach(counter => {

        const target = Number(counter.dataset.target);

        let count = 0;

        const speed = Math.max(10, Math.ceil(target / 50));

        const update = () => {

            if (count < target) {

                count += speed;

                if (count > target) count = target;

                counter.textContent = count;

                requestAnimationFrame(update);

            }

        };

        update();

    });

});