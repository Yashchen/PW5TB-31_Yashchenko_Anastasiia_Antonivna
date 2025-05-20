document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("reliability-form");
  const resultBox = document.getElementById("output-text");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const lambda = parseFloat(document.getElementById("lambda").value);
    const tRestore = parseFloat(document.getElementById("restore").value);
    const tPlanned = parseFloat(document.getElementById("maintenance").value) || 0;
    const system = document.getElementById("type").value;

    if (lambda <= 0 || tRestore <= 0 || tPlanned < 0) {
      resultBox.textContent = "Усі значення повинні бути додатні!";
      return;
    }

    let data;
    try {
      const res = await fetch("data.json");
      data = await res.json();
    } catch (err) {
      resultBox.textContent = "Помилка при отриманні даних.";
      return;
    }

    if (!data || !data.elements) {
      resultBox.textContent = "Неможливо обробити файл даних.";
      return;
    }

    const oneCircuit = data.elements.reduce(
      (sum, el) => {
        sum.lambda += el.rate;
        sum.total += el.rate * el.repair;
        return sum;
      },
      { lambda: 0, total: 0 }
    );

    const avgRepair = oneCircuit.total / oneCircuit.lambda;
    let totalFailureRate, downtime;

    if (system === "single") {
      totalFailureRate = oneCircuit.lambda * avgRepair;
      downtime = 1.2 * (tPlanned / 8760);
    } else {
      const coeff1 = 3.6e-4, coeff2 = 58.9e-4;
      totalFailureRate = 2 * oneCircuit.lambda * (coeff1 + coeff2) + data.backupBreakerRate;
      downtime = 0;
    }

    resultBox.innerHTML = `
      <p>Сумарна частота збоїв: <strong>${totalFailureRate.toFixed(4)} рік⁻¹</strong></p>
      <p>Планова перерва: <strong>${downtime.toFixed(4)} років</strong></p>
    `;
  });
});
