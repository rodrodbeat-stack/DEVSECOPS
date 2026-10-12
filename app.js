(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const toastRegion = $("#toastRegion");
  let pipelineRunning = false;
  let effectsEnabled = false;

  function toast(message, type = "") {
    const item = document.createElement("div");
    item.className = `toast ${type}`;
    item.textContent = message;
    toastRegion.appendChild(item);
    setTimeout(() => item.remove(), 3400);
  }

  function updateClock() {
    const now = new Date();
    $("#clock").textContent = now.toLocaleTimeString("es-CL", { hour12: false });
  }
  updateClock();
  setInterval(updateClock, 1000);

  const views = {
    overview: "view-overview", diagram: "view-diagram", pipeline: "view-pipeline",
    security: "view-security", infrastructure: "view-infrastructure",
    kubernetes: "view-kubernetes", monitoring: "view-monitoring", reports: "view-reports"
  };
  function showView(name) {
    if (!views[name]) return;
    $$(".view").forEach(v => v.classList.toggle("active", v.id === views[name]));
    $$(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.view === name));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  $$(".nav-item").forEach(button => button.addEventListener("click", () => showView(button.dataset.view)));
  $$("[data-go]").forEach(button => button.addEventListener("click", () => showView(button.dataset.go)));

  $("#environment").addEventListener("change", e => {
    toast(`Entorno activo cambiado a ${e.target.value}. Vista de demostración.`, "success");
  });
  $("#soundToggle").addEventListener("click", () => {
    effectsEnabled = !effectsEnabled;
    $("#soundToggle").textContent = effectsEnabled ? "◖♪" : "◖))";
    toast(effectsEnabled ? "Indicador de efectos visuales activado." : "Indicador de efectos visuales desactivado.");
  });

  const nodeInfo = {
    developer: ["Developer / Desarrollo", "Responsable del código fuente, revisión por pares, convenciones de commit y pull/merge requests.", "Entradas: código y pruebas · Salidas: commit revisado."],
    git: ["Git Platform", "Repositorio, control de versiones, ramas protegidas, revisiones y disparadores de pipeline.", "Controles: branch protection, aprobación y auditoría."],
    ci: ["CI Runner", "Obtiene dependencias, compila el artefacto y ejecuta pruebas automáticas.", "Controles: runners aislados, variables protegidas y artefactos trazables."],
    security: ["Security Gate", "Centraliza controles SAST, DAST, SCA, secretos y análisis de contenedores.", "Política sugerida: bloquear hallazgos críticos antes de promover."],
    registry: ["Artifact Registry", "Almacena artefactos e imágenes versionadas para despliegues reproducibles.", "Controles: escaneo, firma, permisos mínimos y retención."],
    iac: ["Terraform / IaC", "Define infraestructura mediante código revisable y planes antes de aplicar cambios.", "Controles: state remoto protegido, revisión de plan y aprobación manual."],
    dev: ["DEV / Integración", "Entorno de feedback rápido para integración, smoke tests y validaciones iniciales.", "Promoción: automatizada con gates de calidad."],
    qa: ["Certificación / QA", "Entorno para regresión, pruebas funcionales, rendimiento y aceptación.", "Promoción: aprobación del responsable y evidencia de pruebas."],
    prod: ["Producción", "Despliegue controlado con estrategia de rollout, observabilidad y plan de rollback.", "Controles: aprobación, monitoreo post-deploy y trazabilidad."]
  };
  $$(".arch-node").forEach(node => node.addEventListener("click", () => {
    $$(".arch-node").forEach(n => n.classList.remove("selected"));
    node.classList.add("selected");
    const info = nodeInfo[node.dataset.node];
    $("#nodeDetails").innerHTML = `<span class="section-index">COMPONENT INSPECTOR / ${node.dataset.node.toUpperCase()}</span><h2>${info[0]}</h2><p>${info[1]}</p><p>${info[2]}</p>`;
  }));
  let zoom = 1;
  function setZoom(next) {
    zoom = Math.min(1.3, Math.max(.65, next));
    $("#diagramCanvas").style.transform = `scale(${zoom})`;
    $("#zoomReset").textContent = `${Math.round(zoom * 100)}%`;
  }
  $("#zoomIn").addEventListener("click", () => setZoom(zoom + .1));
  $("#zoomOut").addEventListener("click", () => setZoom(zoom - .1));
  $("#zoomReset").addEventListener("click", () => setZoom(1));

  const jobDefinitions = [
    { id: "checkout", name: "Checkout", label: "Obtener código fuente", lines: ["Cloning repository into workspace...", "Checking out ref: refs/heads/main", "Commit: 8f3a21c · branch main", "Workspace ready."], duration: 550 },
    { id: "build", name: "Build", label: "Compilar artefacto", lines: ["Restoring dependencies...", "Running build task...", "Artifact generated: app-build.tar", "BUILD SUCCESS"], duration: 700 },
    { id: "test", name: "Test", label: "Pruebas unitarias", lines: ["Starting unit test suite...", "Tests run: 142, failures: 0, skipped: 2", "Coverage report generated: 87.6%", "TESTS PASSED"], duration: 750 },
    { id: "sast", name: "SAST / SCA", label: "Escaneo de código", lines: ["Launching static analysis...", "Checking dependencies and known vulnerabilities...", "Critical: 0 · High: 0 · Medium: 2 · Low: 4", "Policy gate passed (demo threshold)."], duration: 900 },
    { id: "container", name: "Container scan", label: "Imagen y dependencias", lines: ["Building OCI image app-web:demo...", "Scanning image layers...", "Image scan completed. Critical findings: 0", "Image marked as eligible for registry (demo)."], duration: 850 },
    { id: "deploy", name: "Deploy", label: "Despliegue de demostración", lines: ["Waiting for environment approval...", "Demo approval granted locally.", "Applying rolling update to sample workload...", "Deployment simulation completed. No cloud resources were changed."], duration: 850 }
  ];
  let currentJob = "checkout";
  function appendLog(text, kind = "") {
    const output = $("#terminalOutput");
    const span = document.createElement("span");
    span.className = kind ? `log-${kind}` : "";
    span.textContent = text + "\n";
    output.appendChild(span);
    output.scrollTop = output.scrollHeight;
    $("#logLineCount").textContent = `${output.textContent.trimEnd().split("\n").length} líneas`;
  }
  function showJob(jobId) {
    const job = jobDefinitions.find(j => j.id === jobId);
    if (!job) return;
    currentJob = jobId;
    $$(".job-row").forEach(row => row.classList.toggle("selected", row.dataset.job === jobId));
    $("#logTitle").innerHTML = `${job.name.toUpperCase()} <span>OUTPUT</span>`;
    appendLog(`[inspect] ${job.name}: ${job.label}`, "blue");
    job.lines.forEach(line => appendLog(line, line.includes("SUCCESS") || line.includes("PASSED") || line.includes("completed") ? "green" : ""));
  }
  $$(".job-row").forEach(row => row.addEventListener("click", () => {
    if (!pipelineRunning) showJob(row.dataset.job);
    else toast("Espera a que termine la simulación actual.");
  }));

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  async function runPipeline() {
    if (pipelineRunning) { toast("Ya hay una simulación en curso."); return; }
    pipelineRunning = true;
    showView("pipeline");
    const output = $("#terminalOutput");
    output.textContent = "";
    const rows = $$(".job-row");
    rows.forEach(row => { row.classList.remove("done", "running"); row.querySelector("em").textContent = "READY"; });
    $("#pipelineProgressBar").style.width = "0%";
    $("#progressLabel").textContent = "0%";
    appendLog("[system] DEVSECOPS TERMINATOR · local pipeline simulator", "blue");
    appendLog("[warning] Simulación visual: no se conecta a Git, cloud ni clúster real.", "amber");
    for (let i = 0; i < jobDefinitions.length; i++) {
      const job = jobDefinitions[i];
      const row = rows.find(r => r.dataset.job === job.id);
      row.classList.add("running");
      row.querySelector("em").textContent = "RUNNING";
      currentJob = job.id;
      $("#logTitle").innerHTML = `${job.name.toUpperCase()} <span>OUTPUT</span>`;
      appendLog(`$ job ${job.id} --start`, "blue");
      for (const line of job.lines) {
        await sleep(Math.max(110, job.duration / job.lines.length));
        appendLog(line, /SUCCESS|PASSED|completed|ready/i.test(line) ? "green" : (/Critical:/.test(line) ? "amber" : ""));
      }
      row.classList.remove("running");
      row.classList.add("done");
      row.querySelector("em").textContent = "PASSED";
      const percent = Math.round(((i + 1) / jobDefinitions.length) * 100);
      $("#pipelineProgressBar").style.width = `${percent}%`;
      $("#progressLabel").textContent = `${percent}%`;
    }
    appendLog("[system] Pipeline demo finalizado. Todos los jobs simulados completados.", "green");
    pipelineRunning = false;
    toast("Pipeline de demostración completado correctamente.", "success");
  }
  $("#runAll").addEventListener("click", runPipeline);
  $("#runPipelinePage").addEventListener("click", runPipeline);
  $("#clearLogs").addEventListener("click", () => {
    if (pipelineRunning) return toast("No se pueden limpiar logs durante una ejecución.");
    $("#terminalOutput").textContent = "";
    $("#logLineCount").textContent = "0 líneas";
    toast("Terminal limpiada.");
  });

  $$("[data-scan]").forEach(button => button.addEventListener("click", () => {
    const scan = button.dataset.scan;
    button.disabled = true;
    button.textContent = "ANALIZANDO...";
    setTimeout(() => {
      button.disabled = false;
      button.textContent = scan === "SCA" ? "REVISAR DEPENDENCIAS" : scan === "IMAGE SCAN" ? "ESCANEAR IMAGEN" : scan === "DAST" ? "INICIAR PRUEBA" : "EJECUTAR ESCANEO";
      const events = $("#securityEvents");
      const row = document.createElement("div");
      row.className = "event-row";
      row.innerHTML = `<span class="event-indicator green-text">✓</span><div><b>${scan} finalizado (simulación)</b><small>Resultado local · ${new Date().toLocaleTimeString("es-CL")}</small></div><span class="pill success">PASS</span>`;
      events.prepend(row);
      toast(`${scan}: análisis de demostración completado.`, "success");
    }, 1000);
  }));

  const cloudData = {
    Azure: { title: "AZURE DEPLOYMENT MAP", nodes: ["VNet / Subnets", "VM / Node pool", "AKS Cluster"] },
    AWS: { title: "AWS DEPLOYMENT MAP", nodes: ["VPC / Subnets", "EC2 / Node group", "EKS Cluster"] },
    GCP: { title: "GCP DEPLOYMENT MAP", nodes: ["VPC / Subnets", "Compute Engine", "GKE Cluster"] }
  };
  function selectCloud(provider) {
    $("#cloudProvider").value = provider;
    $$(".cloud-card").forEach(card => card.classList.toggle("selected", card.dataset.cloud === provider));
    $("#infraTitle").innerHTML = `${provider.toUpperCase()} <span>DEPLOYMENT MAP</span>`;
    const labels = $$(".infra-node small");
    labels[1].textContent = cloudData[provider].nodes[0];
    labels[2].textContent = cloudData[provider].nodes[1];
    labels[3].textContent = cloudData[provider].nodes[2];
    toast(`Vista conceptual cambiada a ${provider}.`);
  }
  $$(".cloud-card").forEach(card => card.addEventListener("click", () => selectCloud(card.dataset.cloud)));
  $("#cloudProvider").addEventListener("change", e => selectCloud(e.target.value));
  $("#showTerraform").addEventListener("click", () => {
    $("#terraformSample").classList.toggle("hidden");
    $("#showTerraform").textContent = $("#terraformSample").classList.contains("hidden") ? "VER EJEMPLO DE PLAN" : "OCULTAR EJEMPLO";
  });

  $("#refreshKube").addEventListener("click", () => {
    $("#podCount").innerHTML = `18<span class="unit">/20</span>`;
    toast("Vista de Kubernetes actualizada. Datos de demostración.", "success");
  });

  function drawChart() {
    const chart = $("#cpuChart");
    chart.innerHTML = "";
    const values = [32, 41, 38, 55, 47, 62, 52, 45, 69, 58, 49, 42, 46, 57, 42, 39, 51, 42, 61, 44, 48, 42];
    values.forEach(value => {
      const bar = document.createElement("i");
      bar.className = "chart-bar";
      bar.style.height = `${value}%`;
      bar.title = `CPU ${value}% (dato ilustrativo)`;
      chart.appendChild(bar);
    });
  }
  drawChart();
  setInterval(() => {
    if (!$("#view-monitoring").classList.contains("active")) return;
    const value = 35 + Math.floor(Math.random() * 32);
    $("#cpuValue").innerHTML = `${value}<span class="unit">%</span>`;
    $("#cpuBar").style.width = `${value}%`;
  }, 4500);

  $("#exportReport").addEventListener("click", () => {
    const report = [
      "DEVSECOPS TERMINATOR — REPORTE OPERACIONAL",
      `Fecha: ${new Date().toLocaleString("es-CL")}`,
      "Modo: DEMOSTRACIÓN — datos no conectados a sistemas reales",
      "",
      "Pipelines ejecutados (demo): 24",
      "Éxito de deployments (demo): 89%",
      "Cobertura de controles (demo): 98.4%",
      "Alertas abiertas (demo): 03",
      "",
      "Este archivo contiene indicadores ilustrativos. Conectar APIs autenticadas para obtener datos reales."
    ].join("\r\n");
    const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "devsecops-terminator-reporte.txt";
    a.click();
    URL.revokeObjectURL(url);
    toast("Reporte de demostración exportado.", "success");
  });

  // Prevent accidental submission if controls are later wrapped in forms.
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      $$(".toast").forEach(item => item.remove());
    }
  });
})();