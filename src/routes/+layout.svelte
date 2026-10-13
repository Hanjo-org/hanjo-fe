<script lang="ts">
  import "../app.css";
  import "./layout.css";
  import { page } from "$app/state";
  import { themeStore } from "../lib/theme.svelte";

  let { children } = $props();

  let currentPath = $derived(page.url.pathname);
  let currentTime = $state("10:24 WIB");
  let currentDate = $state("Selasa, 13 Oktober 2026");

  // Sidebar & Nav State
  let isCollapsed = $state(false);
  let openAccordion = $state<string | null>(null);
  let activeRole = $state<"owner" | "finance" | "store_manager">("owner");
  let partnerFeatureEnabled = $state(true);
  let showRoleSwitcher = $state(false);

  // Quick Command Palette (Ctrl+K)
  let showCommandPalette = $state(false);
  let commandQuery = $state("");
  let commandInputRef = $state<HTMLInputElement | null>(null);

  // Multi-Outlet Filter (PRD Section 8.1 & 13.2)
  let selectedOutletFilter = $state("Semua Outlet");
  let selectedOwnerType = $state<"ALL" | "OWN" | "PARTNER">("ALL");
  let showOutletDropdown = $state(false);
  let showNotifications = $state(false);
  let mobileSidebarOpen = $state(false);
  let isFullscreen = $state(false);

  // Inisialisasi tema, waktu, dan accordion aktif otomatis
  $effect(() => {
    themeStore.init();

    if (typeof window !== "undefined") {
      const savedCollapsed = localStorage.getItem("hanjo_sidebar_collapsed");
      if (savedCollapsed !== null) {
        isCollapsed = savedCollapsed === "true";
      }
    }

    const updateTime = () => {
      if (typeof window !== "undefined") {
        const now = new Date();
        currentTime =
          now.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          }) + " WIB";
        const options: Intl.DateTimeFormatOptions = {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        };
        currentDate = now.toLocaleDateString("id-ID", options);
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  });

  // Otomatis buka accordion untuk rute aktif saat berpindah halaman
  $effect(() => {
    if (currentPath.startsWith("/inventory")) openAccordion = "inventory";
    else if (currentPath.startsWith("/procurement"))
      openAccordion = "procurement";
    else if (currentPath.startsWith("/petty-cash"))
      openAccordion = "petty-cash";
    else if (currentPath.startsWith("/finance")) openAccordion = "finance";
    else if (
      currentPath.startsWith("/reports") ||
      currentPath.startsWith("/sales")
    )
      openAccordion = "reports";
    else if (currentPath.startsWith("/catalog")) openAccordion = "catalog";
    else if (currentPath.startsWith("/outlets")) openAccordion = "outlets";
    else if (currentPath.startsWith("/settings")) openAccordion = "settings";
  });

  // Global Keyboard Shortcut Listener (Ctrl+K / Cmd+K & Esc)
  $effect(() => {
    if (typeof window === "undefined") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggleCommandPalette();
      } else if (e.key === "Escape") {
        showCommandPalette = false;
        showOutletDropdown = false;
        showNotifications = false;
        showRoleSwitcher = false;
      }
    };

    const handleFullscreenChange = () => {
      isFullscreen = typeof document !== "undefined" && !!document.fullscreenElement;
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  });

  function toggleFullscreen() {
    if (typeof document === "undefined") return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }

  function toggleCollapse() {
    isCollapsed = !isCollapsed;
    if (typeof window !== "undefined") {
      localStorage.setItem("hanjo_sidebar_collapsed", String(isCollapsed));
    }
  }

  function toggleAccordion(groupKey: string) {
    if (openAccordion === groupKey) {
      openAccordion = null;
    } else {
      openAccordion = groupKey;
    }
  }

  function toggleCommandPalette() {
    showCommandPalette = !showCommandPalette;
    if (showCommandPalette) {
      commandQuery = "";
      setTimeout(() => commandInputRef?.focus(), 50);
    }
  }

  function selectCommand(href: string) {
    showCommandPalette = false;
    window.location.href = href;
  }

  // Daftar Item Lengkap untuk Command Palette Quick Search
  const commandItems = [
    {
      title: "Dashboard Eksekutif",
      section: "Umum",
      href: "/",
      icon: "📊",
      tags: ["omzet", "kpi", "home"],
    },
    {
      title: "Persetujuan (Approval Inbox)",
      section: "Tindakan",
      href: "/approvals",
      icon: "⚡",
      tags: ["approval", "inbox", "verifikasi"],
    },

    // Operasional: Inventaris
    {
      title: "Stok per Outlet",
      section: "Operasional • Inventaris",
      href: "/inventory",
      icon: "📦",
      tags: ["stok", "bahan", "buffer"],
    },
    {
      title: "Pergerakan Stok (Ledger)",
      section: "Operasional • Inventaris",
      href: "/inventory#movements",
      icon: "🔄",
      tags: ["ledger", "kartu stok", "mutasi"],
    },
    {
      title: "Stock Opname Fisik",
      section: "Operasional • Inventaris",
      href: "/inventory#opname",
      icon: "📋",
      tags: ["hitung fisik", "selisih", "opname"],
    },
    {
      title: "Pencatatan Waste & Rusak",
      section: "Operasional • Inventaris",
      href: "/inventory#waste",
      icon: "🗑️",
      tags: ["waste", "rusak", "basi"],
    },
    {
      title: "Produksi Bahan Olahan",
      section: "Operasional • Inventaris",
      href: "/inventory#production",
      icon: "🏭",
      tags: ["produksi", "batch", "simple syrup"],
    },

    // Operasional: Pembelian & Hutang
    {
      title: "Permintaan Barang (PO Blind)",
      section: "Operasional • Pembelian",
      href: "/procurement#po",
      icon: "📑",
      tags: ["po", "order", "reorder"],
    },
    {
      title: "Penerimaan Barang (Goods Receipt)",
      section: "Operasional • Pembelian",
      href: "/procurement#receipts",
      icon: "📥",
      tags: ["surat jalan", "terima"],
    },
    {
      title: "Input Nota Supplier (True-Up)",
      section: "Operasional • Pembelian",
      href: "/procurement#invoices",
      icon: "🧾",
      tags: ["nota", "foto", "supplier invoice"],
    },
    {
      title: "Daftar Tagihan (Bills)",
      section: "Operasional • Pembelian",
      href: "/procurement#bills",
      icon: "💵",
      tags: ["tagihan", "jatuh tempo", "bill"],
    },
    {
      title: "Pembayaran Hutang",
      section: "Operasional • Pembelian",
      href: "/procurement#payments",
      icon: "💳",
      tags: ["bayar", "alokasi", "transfer"],
    },
    {
      title: "Daftar Pemasok (Suppliers)",
      section: "Operasional • Pembelian",
      href: "/procurement#suppliers",
      icon: "🏢",
      tags: ["vendor", "gudang pusat", "supplier"],
    },

    // Operasional: Biaya & Kas Kecil
    {
      title: "Kas Kecil Outlet (Petty Cash)",
      section: "Operasional • Kas",
      href: "/petty-cash",
      icon: "💰",
      tags: ["kas kecil", "float", "nota kecil"],
    },
    {
      title: "Biaya Pusat (HQ Expenses)",
      section: "Operasional • Kas",
      href: "/petty-cash#hq",
      icon: "🏛️",
      tags: ["biaya pusat", "operasional", "hq"],
    },

    // Keuangan
    {
      title: "Rekonsiliasi HPP & True-Up",
      section: "Keuangan",
      href: "/finance",
      icon: "📈",
      tags: ["true-up", "hpp", "selisih"],
    },
    {
      title: "Pajak PBJT & PPN",
      section: "Keuangan",
      href: "/finance#tax",
      icon: "🏛️",
      tags: ["pajak", "pb1", "ppn"],
    },
    {
      title: "Penutupan Periode Fiskal",
      section: "Keuangan",
      href: "/finance#periods",
      icon: "🔒",
      tags: ["tutup buku", "fiskal", "periode"],
    },
    {
      title: "Rekonsiliasi Midtrans / POS",
      section: "Keuangan",
      href: "/finance#reconciliation",
      icon: "🔄",
      tags: ["qris", "settlement", "rekon"],
    },

    // Laporan (termasuk Penjualan POS)
    {
      title: "Laporan Laba Rugi (P&L)",
      section: "Laporan",
      href: "/reports",
      icon: "📊",
      tags: ["pnl", "margin", "gross profit"],
    },
    {
      title: "Laporan Penjualan POS (Audit Struk)",
      section: "Laporan",
      href: "/sales",
      icon: "🧾",
      tags: ["pos", "penjualan", "struk", "omzet"],
    },
    {
      title: "Rekapitulasi Pajak Daerah",
      section: "Laporan",
      href: "/reports#tax",
      icon: "📑",
      tags: ["rekap pajak", "pbjt"],
    },

    // Master Data
    {
      title: "Katalog Menu & Produk",
      section: "Master Data",
      href: "/catalog",
      icon: "☕",
      tags: ["menu", "kopi", "harga"],
    },
    {
      title: "Resep BOM Berversi",
      section: "Master Data",
      href: "/catalog#recipes",
      icon: "🧪",
      tags: ["bom", "resep", "gramasi"],
    },
    {
      title: "Master Bahan Baku (Ingredients)",
      section: "Master Data",
      href: "/catalog#ingredients",
      icon: "🌾",
      tags: ["bahan", "biji kopi", "susu"],
    },
    {
      title: "Master Outlet & Cabang",
      section: "Master Data",
      href: "/outlets",
      icon: "🏢",
      tags: ["outlet", "cabang", "senopati"],
    },
    {
      title: "Kepemilikan & Mitra Franchise",
      section: "Master Data",
      href: "/outlets#partners",
      icon: "🤝",
      tags: ["mitra", "investor", "franchise"],
    },

    // Sistem
    {
      title: "Pengaturan & Feature Flags",
      section: "Sistem",
      href: "/settings",
      icon: "⚙️",
      tags: ["flag", "konfigurasi", "setting"],
    },
    {
      title: "Aturan Mesin Persetujuan",
      section: "Sistem",
      href: "/settings#approvals",
      icon: "📐",
      tags: ["aturan", "approval rule"],
    },
    {
      title: "Audit Log Sistem (Append-Only)",
      section: "Sistem",
      href: "/settings#audit",
      icon: "📜",
      tags: ["audit", "jejak", "log"],
    },
  ];

  let filteredCommands = $derived(
    commandQuery.trim() === ""
      ? commandItems.slice(0, 10)
      : commandItems.filter((item) => {
          const q = commandQuery.toLowerCase();
          return (
            item.title.toLowerCase().includes(q) ||
            item.section.toLowerCase().includes(q) ||
            item.tags.some((t) => t.includes(q))
          );
        }),
  );
</script>

<div class="app-layout">
  <!-- Mobile Backdrop -->
  {#if mobileSidebarOpen}
    <div
      class="sidebar-backdrop"
      role="button"
      tabindex="0"
      aria-label="Tutup Menu"
      onclick={() => (mobileSidebarOpen = false)}
      onkeydown={(e) => e.key === "Escape" && (mobileSidebarOpen = false)}
    ></div>
  {/if}

  <!-- Sidebar Left: 6 Aturan Struktur Baru -->
  <aside
    class="sidebar"
    class:collapsed={isCollapsed}
    class:mobile-open={mobileSidebarOpen}
  >
    <!-- Brand Header & Collapse Toggle -->
    <div class="brand">
      <div class="brand-left">
        <div class="brand-emblem" title="HANJO ERP Pusat">
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
            <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
            <line x1="6" y1="1" x2="6" y2="4" />
            <line x1="10" y1="1" x2="10" y2="4" />
            <line x1="14" y1="1" x2="14" y2="4" />
          </svg>
        </div>
        {#if !isCollapsed}
          <div class="brand-text">
            <h1 class="brand-title">HANJO</h1>
            <span class="brand-subtitle">ERP Backoffice Pusat</span>
          </div>
        {/if}
      </div>

      <!-- Tombol Ciutkan / Perluas Sidebar -->
      <button
        class="collapse-toggle-btn"
        onclick={toggleCollapse}
        title={isCollapsed ? "Perluas Sidebar" : "Ciutkan Sidebar"}
        aria-label={isCollapsed ? "Perluas Sidebar" : "Ciutkan Sidebar"}
      >
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          {#if isCollapsed}
            <polyline points="9 18 15 12 9 6" />
          {:else}
            <polyline points="15 18 9 12 15 6" />
          {/if}
        </svg>
      </button>
    </div>

    <!-- Nav Menu dengan Label Seksi & Accordion Submenu -->
    <nav class="nav-menu">
      <!-- TOP ITEMS (Tanpa label seksi) -->
      <div class="nav-group top-group">
        <!-- Dashboard -->
        <a
          href="/"
          class="nav-item"
          class:active={currentPath === "/"}
          title="Dashboard Ringkasan"
        >
          <span class="nav-icon">
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
            </svg>
          </span>
          {#if !isCollapsed}
            <span class="nav-label">Dashboard</span>
          {/if}
        </a>

        <!-- Persetujuan (Tepat di bawah Dashboard - Kotak masuk harian) -->
        <a
          href="/approvals"
          class="nav-item"
          class:active={currentPath.startsWith("/approvals")}
          title="Persetujuan Tertunda (2 Antrean)"
        >
          <span class="nav-icon">
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M9 11l3 3L22 4" />
              <path
                d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"
              />
            </svg>
          </span>
          {#if !isCollapsed}
            <span class="nav-label">Persetujuan</span>
            <!-- Aturan Lencana Konsisten: Kuning (Peringatan/Antrean) -->
            <span class="badge-count badge-warning">2</span>
          {:else}
            <span class="collapsed-badge-dot badge-warning"></span>
          {/if}
        </a>
      </div>

      <!-- SEKSI 1: OPERASIONAL -->
      <div class="nav-section">
        {#if !isCollapsed}
          <span class="nav-section-title">OPERASIONAL</span>
        {:else}
          <div class="section-divider"></div>
        {/if}

        <!-- Inventaris (Accordion) -->
        <div
          class="accordion-item"
          class:is-open={openAccordion === "inventory"}
        >
          <div
            class="nav-item has-submenu"
            class:active={currentPath.startsWith("/inventory")}
            onclick={() => toggleAccordion("inventory")}
            role="button"
            tabindex="0"
            onkeydown={(e) => e.key === "Enter" && toggleAccordion("inventory")}
            title="Inventaris (2 Stok Rendah)"
          >
            <span class="nav-icon">
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
                />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </span>
            {#if !isCollapsed}
              <span class="nav-label">Inventaris</span>
              <!-- Aturan Lencana Konsisten: Merah (Kritis/Stok Rendah) -->
              <span class="badge-count badge-danger">2</span>
              <span
                class="accordion-chevron"
                class:rotate={openAccordion === "inventory"}>▾</span
              >
            {:else}
              <span class="collapsed-badge-dot badge-danger"></span>
            {/if}
          </div>

          {#if !isCollapsed && openAccordion === "inventory"}
            <div class="submenu-list">
              <a
                href="/inventory"
                class="submenu-item"
                class:active={currentPath === "/inventory"}>Stok per Outlet</a
              >
              <a href="/inventory#movements" class="submenu-item">Pergerakan</a>
              <a href="/inventory#opname" class="submenu-item">Opname</a>
              <a href="/inventory#waste" class="submenu-item">Waste</a>
              <a href="/inventory#production" class="submenu-item">Produksi</a>
            </div>
          {/if}
        </div>

        <!-- Pembelian & Hutang (Accordion) -->
        <div
          class="accordion-item"
          class:is-open={openAccordion === "procurement"}
        >
          <div
            class="nav-item has-submenu"
            class:active={currentPath.startsWith("/procurement")}
            onclick={() => toggleAccordion("procurement")}
            role="button"
            tabindex="0"
            onkeydown={(e) =>
              e.key === "Enter" && toggleAccordion("procurement")}
            title="Pembelian & Hutang (1 Nota Menunggu)"
          >
            <span class="nav-icon">
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </span>
            {#if !isCollapsed}
              <span class="nav-label">Pembelian & Hutang</span>
              <!-- Aturan Lencana Konsisten: Merah (Nota Menunggu) -->
              <span class="badge-count badge-danger">1</span>
              <span
                class="accordion-chevron"
                class:rotate={openAccordion === "procurement"}>▾</span
              >
            {:else}
              <span class="collapsed-badge-dot badge-danger"></span>
            {/if}
          </div>

          {#if !isCollapsed && openAccordion === "procurement"}
            <div class="submenu-list">
              <a href="/procurement#po" class="submenu-item"
                >Permintaan Barang</a
              >
              <a href="/procurement#receipts" class="submenu-item">Penerimaan</a
              >
              <a href="/procurement#invoices" class="submenu-item"
                >Nota Supplier</a
              >
              <a href="/procurement#bills" class="submenu-item">Tagihan</a>
              <a href="/procurement#payments" class="submenu-item">Pembayaran</a
              >
              <a href="/procurement#suppliers" class="submenu-item">Pemasok</a>
            </div>
          {/if}
        </div>

        <!-- Biaya & Kas Kecil (Accordion) -->
        <div
          class="accordion-item"
          class:is-open={openAccordion === "petty-cash"}
        >
          <div
            class="nav-item has-submenu"
            class:active={currentPath.startsWith("/petty-cash")}
            onclick={() => toggleAccordion("petty-cash")}
            role="button"
            tabindex="0"
            onkeydown={(e) =>
              e.key === "Enter" && toggleAccordion("petty-cash")}
            title="Biaya & Kas Kecil (1 Belum Diverifikasi)"
          >
            <span class="nav-icon">
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <circle cx="12" cy="12" r="2" />
                <path d="M6 12h.01M18 12h.01" />
              </svg>
            </span>
            {#if !isCollapsed}
              <span class="nav-label">Biaya & Kas Kecil</span>
              <!-- Aturan Lencana Konsisten: Kuning (Belum Diverifikasi) -->
              <span class="badge-count badge-warning">1</span>
              <span
                class="accordion-chevron"
                class:rotate={openAccordion === "petty-cash"}>▾</span
              >
            {:else}
              <span class="collapsed-badge-dot badge-warning"></span>
            {/if}
          </div>

          {#if !isCollapsed && openAccordion === "petty-cash"}
            <div class="submenu-list">
              <a
                href="/petty-cash"
                class="submenu-item"
                class:active={currentPath === "/petty-cash"}>Kas Kecil</a
              >
              <a href="/petty-cash#hq" class="submenu-item">Biaya Pusat</a>
            </div>
          {/if}
        </div>
      </div>

      <!-- SEKSI 2: KEUANGAN -->
      <div class="nav-section">
        {#if !isCollapsed}
          <span class="nav-section-title">KEUANGAN</span>
        {:else}
          <div class="section-divider"></div>
        {/if}

        <!-- Keuangan & Pajak (Accordion - Disembunyikan untuk store_manager) -->
        {#if activeRole !== "store_manager"}
          <div
            class="accordion-item"
            class:is-open={openAccordion === "finance"}
          >
            <div
              class="nav-item has-submenu"
              class:active={currentPath.startsWith("/finance")}
              onclick={() => toggleAccordion("finance")}
              role="button"
              tabindex="0"
              onkeydown={(e) => e.key === "Enter" && toggleAccordion("finance")}
              title="Keuangan & Pajak (1 True-Up Tertunda)"
            >
              <span class="nav-icon">
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </span>
              {#if !isCollapsed}
                <span class="nav-label">Keuangan & Pajak</span>
                <!-- Aturan Lencana Konsisten: Biru (Informasi / True-Up) -->
                <span class="badge-count badge-info">1</span>
                <span
                  class="accordion-chevron"
                  class:rotate={openAccordion === "finance"}>▾</span
                >
              {:else}
                <span class="collapsed-badge-dot badge-info"></span>
              {/if}
            </div>

            {#if !isCollapsed && openAccordion === "finance"}
              <div class="submenu-list">
                <a
                  href="/finance"
                  class="submenu-item"
                  class:active={currentPath === "/finance"}>True-Up HPP</a
                >
                <a href="/finance#tax" class="submenu-item">Pajak PBJT & PPN</a>
                <a href="/finance#periods" class="submenu-item"
                  >Periode Fiskal</a
                >
                <a href="/finance#reconciliation" class="submenu-item"
                  >Rekonsiliasi</a
                >
              </div>
            {/if}
          </div>
        {/if}

        <!-- Laporan (Termasuk Penjualan POS yang dipindahkan ke sini!) -->
        <div class="accordion-item" class:is-open={openAccordion === "reports"}>
          <div
            class="nav-item has-submenu"
            class:active={currentPath.startsWith("/reports") ||
              currentPath.startsWith("/sales")}
            onclick={() => toggleAccordion("reports")}
            role="button"
            tabindex="0"
            onkeydown={(e) => e.key === "Enter" && toggleAccordion("reports")}
            title="Laporan & Audit"
          >
            <span class="nav-icon">
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </span>
            {#if !isCollapsed}
              <span class="nav-label">Laporan</span>
              <span
                class="accordion-chevron"
                class:rotate={openAccordion === "reports"}>▾</span
              >
            {/if}
          </div>

          {#if !isCollapsed && openAccordion === "reports"}
            <div class="submenu-list">
              <a
                href="/reports"
                class="submenu-item"
                class:active={currentPath === "/reports"}>Ringkasan P&L</a
              >
              <!-- Pindahan 'Penjualan POS' menjadi 'Laporan Penjualan' sesuai permintaan -->
              <a
                href="/sales"
                class="submenu-item"
                class:active={currentPath === "/sales"}
              >
                <span>Laporan Penjualan</span>
                <span class="sub-tag">POS</span>
              </a>
              <a href="/reports#tax" class="submenu-item">Rekap Pajak</a>
            </div>
          {/if}
        </div>
      </div>

      <!-- SEKSI 3: MASTER DATA -->
      <div class="nav-section">
        {#if !isCollapsed}
          <span class="nav-section-title">MASTER DATA</span>
        {:else}
          <div class="section-divider"></div>
        {/if}

        <!-- Katalog & Resep (Accordion - Disembunyikan untuk Finance) -->
        {#if activeRole !== "finance"}
          <div
            class="accordion-item"
            class:is-open={openAccordion === "catalog"}
          >
            <div
              class="nav-item has-submenu"
              class:active={currentPath.startsWith("/catalog")}
              onclick={() => toggleAccordion("catalog")}
              role="button"
              tabindex="0"
              onkeydown={(e) => e.key === "Enter" && toggleAccordion("catalog")}
              title="Katalog & Resep"
            >
              <span class="nav-icon">
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path
                    d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
                  />
                </svg>
              </span>
              {#if !isCollapsed}
                <span class="nav-label">Katalog & Resep</span>
                <span
                  class="accordion-chevron"
                  class:rotate={openAccordion === "catalog"}>▾</span
                >
              {/if}
            </div>

            {#if !isCollapsed && openAccordion === "catalog"}
              <div class="submenu-list">
                <a
                  href="/catalog"
                  class="submenu-item"
                  class:active={currentPath === "/catalog"}>Menu & Produk</a
                >
                <a href="/catalog#recipes" class="submenu-item"
                  >Resep BOM Berversi</a
                >
                <a href="/catalog#modifiers" class="submenu-item">Modifier</a>
                <a href="/catalog#channels" class="submenu-item"
                  >Harga & Channel</a
                >
                <a href="/catalog#ingredients" class="submenu-item"
                  >Bahan Baku</a
                >
                <a href="/catalog#proposals" class="submenu-item">Usulan Menu</a
                >
              </div>
            {/if}
          </div>
        {/if}

        <!-- Outlet & Mitra (Accordion) -->
        <div class="accordion-item" class:is-open={openAccordion === "outlets"}>
          <div
            class="nav-item has-submenu"
            class:active={currentPath.startsWith("/outlets")}
            onclick={() => toggleAccordion("outlets")}
            role="button"
            tabindex="0"
            onkeydown={(e) => e.key === "Enter" && toggleAccordion("outlets")}
            title="Outlet & Mitra"
          >
            <span class="nav-icon">
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </span>
            {#if !isCollapsed}
              <span class="nav-label"
                >{partnerFeatureEnabled
                  ? "Outlet & Mitra"
                  : "Daftar Outlet"}</span
              >
              <span
                class="accordion-chevron"
                class:rotate={openAccordion === "outlets"}>▾</span
              >
            {/if}
          </div>

          {#if !isCollapsed && openAccordion === "outlets"}
            <div class="submenu-list">
              <a
                href="/outlets"
                class="submenu-item"
                class:active={currentPath === "/outlets"}>Daftar Outlet</a
              >
              <!-- Menu Mitra disembunyikan jika feature flag dimatikan -->
              {#if partnerFeatureEnabled}
                <a href="/outlets#partners" class="submenu-item"
                  >Kepemilikan & Mitra</a
                >
              {/if}
            </div>
          {/if}
        </div>
      </div>

      <!-- SEKSI 4: SISTEM (Dipisahkan di Bagian Bawah) -->
      {#if activeRole !== "store_manager"}
        <div class="nav-section system-section">
          {#if !isCollapsed}
            <span class="nav-section-title">SISTEM</span>
          {:else}
            <div class="section-divider"></div>
          {/if}

          <!-- Pengaturan -->
          <div
            class="accordion-item"
            class:is-open={openAccordion === "settings"}
          >
            <div
              class="nav-item has-submenu"
              class:active={currentPath.startsWith("/settings")}
              onclick={() => toggleAccordion("settings")}
              role="button"
              tabindex="0"
              onkeydown={(e) =>
                e.key === "Enter" && toggleAccordion("settings")}
              title="Pengaturan Sistem"
            >
              <span class="nav-icon">
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path
                    d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
                  />
                </svg>
              </span>
              {#if !isCollapsed}
                <span class="nav-label">Pengaturan</span>
                <span
                  class="accordion-chevron"
                  class:rotate={openAccordion === "settings"}>▾</span
                >
              {/if}
            </div>

            {#if !isCollapsed && openAccordion === "settings"}
              <div class="submenu-list">
                <a
                  href="/settings"
                  class="submenu-item"
                  class:active={currentPath === "/settings"}>Konfigurasi Umum</a
                >
                <a href="/settings#approvals" class="submenu-item"
                  >Aturan Persetujuan</a
                >
                <a href="/settings#audit" class="submenu-item">Audit Log</a>
              </div>
            {/if}
          </div>
        </div>
      {/if}
    </nav>

    <!-- Sidebar Bottom: Kartu Profil & Switcher Peran Cepat -->
    <div class="sidebar-bottom">
      <div
        class="user-profile-card"
        role="button"
        tabindex="0"
        onclick={() => (showRoleSwitcher = !showRoleSwitcher)}
        onkeydown={(e) =>
          e.key === "Enter" && (showRoleSwitcher = !showRoleSwitcher)}
        title="Klik untuk ganti peran atau feature flag"
      >
        <div
          class="user-avatar"
          class:finance={activeRole === "finance"}
          class:manager={activeRole === "store_manager"}
        >
          {activeRole === "owner"
            ? "BP"
            : activeRole === "finance"
              ? "FN"
              : "SM"}
        </div>
        {#if !isCollapsed}
          <div class="user-meta">
            <span class="user-name">
              {activeRole === "owner"
                ? "Budi Pratama"
                : activeRole === "finance"
                  ? "Siti Finance"
                  : "Reza Fahmi"}
            </span>
            <span class="user-role">
              {activeRole === "owner"
                ? "Owner & Direksi"
                : activeRole === "finance"
                  ? "Finance & Tax Manager"
                  : "Store Manager Senopati"}
            </span>
          </div>
          <span class="user-chevron">⚙️</span>
        {/if}
      </div>

      <!-- Role & Feature Flag Switcher Popover -->
      {#if showRoleSwitcher}
        <div
          class="role-switcher-popover panel-card"
          role="region"
          aria-label="Pengaturan Peran & Flag"
        >
          <div class="popover-header">
            <strong>Simulasi Peran Akses</strong>
            <button
              class="popover-close"
              onclick={() => (showRoleSwitcher = false)}>✕</button
            >
          </div>

          <div class="role-options">
            <button
              class="role-opt-btn"
              class:active={activeRole === "owner"}
              onclick={() => {
                activeRole = "owner";
                showRoleSwitcher = false;
              }}
            >
              <span class="role-badge">Owner</span>
              <small>Akses Penuh Semua Modul</small>
            </button>

            <button
              class="role-opt-btn"
              class:active={activeRole === "finance"}
              onclick={() => {
                activeRole = "finance";
                showRoleSwitcher = false;
              }}
            >
              <span class="role-badge">Finance</span>
              <small>Tanpa Modul Katalog</small>
            </button>

            <button
              class="role-opt-btn"
              class:active={activeRole === "store_manager"}
              onclick={() => {
                activeRole = "store_manager";
                showRoleSwitcher = false;
              }}
            >
              <span class="role-badge">Store Manager</span>
              <small>Tanpa Keuangan & Pengaturan</small>
            </button>
          </div>

          <div class="flag-toggle-row">
            <span>Fitur Mitra Franchise</span>
            <button
              class="flag-pill-toggle"
              class:enabled={partnerFeatureEnabled}
              onclick={() => (partnerFeatureEnabled = !partnerFeatureEnabled)}
            >
              {partnerFeatureEnabled ? "Aktif" : "Nonaktif"}
            </button>
          </div>
        </div>
      {/if}

      {#if !isCollapsed}
        <div class="sidebar-version">HANJO ERP • Single-Tenant v1.0.0</div>
      {/if}
    </div>
  </aside>

  <!-- Main Content Area with Top Navbar -->
  <div class="main-wrapper">
    <!-- Top Navbar -->
    <header class="top-navbar">
      <!-- Mobile Hamburger Toggle -->
      <button
        class="mobile-menu-btn"
        onclick={() => (mobileSidebarOpen = !mobileSidebarOpen)}
        aria-label="Toggle Menu"
      >
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <!-- Quick Search Trigger (Ctrl+K) -->
      <div
        class="search-box"
        role="button"
        tabindex="0"
        onclick={toggleCommandPalette}
        onkeydown={(e) =>
          (e.key === "Enter" || e.key === " ") && toggleCommandPalette()}
        title="Pencarian Cepat Halaman & Modul (Ctrl+K)"
      >
        <svg
          class="search-icon"
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <span class="search-placeholder"
          >Cari transaksi, bahan, resep, atau lompat menu...</span
        >
        <kbd class="search-kbd">⌘ K</kbd>
      </div>

      <!-- Right Navbar Items -->
      <div class="navbar-right">
        <!-- Notification Bell with Dot -->
        <div class="notification-wrapper" style="position: relative;">
          <button
            type="button"
            class="nav-action-btn"
            aria-label="Buka Notifikasi"
            onclick={() => (showNotifications = !showNotifications)}
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span class="unread-dot"></span>
          </button>

          {#if showNotifications}
            <div
              class="notification-dropdown panel-card"
              role="region"
              aria-label="Panel Notifikasi"
            >
              <div class="dropdown-header">
                <span>Peringatan & Tindakan</span>
                <span class="pill-badge pill-warning">2 Baru</span>
              </div>
              <div class="notif-item">
                <span class="notif-icon danger">⚠️</span>
                <div class="notif-text">
                  <strong>Stok Minimum:</strong> Fresh Milk Senopati sisa 18.2 L
                  <small>10 menit lalu • Butuh PO</small>
                </div>
              </div>
              <div class="notif-item">
                <span class="notif-icon info">📑</span>
                <div class="notif-text">
                  <strong>Nota Supplier Baru:</strong> Menunggu verifikasi
                  Finance
                  <small>1 jam lalu • RCV-JKT-01-20261012</small>
                </div>
              </div>
            </div>
          {/if}
        </div>

        <!-- Theme Switcher Button (PRD 13.1 Light/Dark Mode Toggle) -->
        <button
          class="nav-action-btn theme-toggle-btn"
          onclick={() => themeStore.toggle()}
          title={themeStore.current === "dark"
            ? "Beralih ke Mode Terang (Light Mode)"
            : "Beralih ke Mode Gelap (Dark Mode)"}
          aria-label="Ganti Tema Tampilan"
        >
          {#if themeStore.current === "dark"}
            <svg
              viewBox="0 0 24 24"
              width="17"
              height="17"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          {:else}
            <svg
              viewBox="0 0 24 24"
              width="17"
              height="17"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          {/if}
        </button>

        <!-- Fullscreen Mode Toggle Button -->
        <button
          type="button"
          class="nav-action-btn fullscreen-toggle-btn"
          onclick={toggleFullscreen}
          title={isFullscreen
            ? "Keluar dari Mode Layar Penuh (Esc)"
            : "Tampilkan Layar Penuh (Fullscreen)"}
          aria-label={isFullscreen
            ? "Keluar Layar Penuh"
            : "Masuk Mode Layar Penuh"}
        >
          {#if isFullscreen}
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"
              />
            </svg>
          {:else}
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M15 3h6v6m0 6v6h-6M9 21H3v-6M3 9V3h6" />
            </svg>
          {/if}
        </button>

        <!-- Outlet Scoping Selector (PRD 8.1 & 13.2) -->
        <div class="outlet-dropdown-wrapper">
          <button
            class="outlet-pill-btn"
            onclick={() => (showOutletDropdown = !showOutletDropdown)}
          >
            <svg
              viewBox="0 0 24 24"
              width="15"
              height="15"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M3 21h18M3 7v14M21 7v14M6 11h4M6 15h4M14 11h4M14 15h4M9 3l3-2 3 2v4H9V3z"
              />
            </svg>
            <span class="outlet-label">{selectedOutletFilter}</span>
            <span class="dropdown-arrow">▾</span>
          </button>

          {#if showOutletDropdown}
            <div
              class="outlet-menu panel-card"
              role="region"
              aria-label="Pilih Outlet"
            >
              <div class="outlet-filter-types">
                <button
                  class="filter-tab-btn"
                  class:active={selectedOwnerType === "ALL"}
                  onclick={() => (selectedOwnerType = "ALL")}>Semua</button
                >
                <button
                  class="filter-tab-btn"
                  class:active={selectedOwnerType === "OWN"}
                  onclick={() => (selectedOwnerType = "OWN")}
                  >Milik Sendiri</button
                >
                {#if partnerFeatureEnabled}
                  <button
                    class="filter-tab-btn"
                    class:active={selectedOwnerType === "PARTNER"}
                    onclick={() => (selectedOwnerType = "PARTNER")}
                    >Mitra</button
                  >
                {/if}
              </div>

              {#if selectedOwnerType === "ALL" || selectedOwnerType === "OWN"}
                <button
                  class="outlet-option"
                  class:active={selectedOutletFilter === "Semua Outlet"}
                  onclick={() => {
                    selectedOutletFilter = "Semua Outlet";
                    showOutletDropdown = false;
                  }}
                >
                  <span>🌐 Konsolidasi Semua Outlet</span>
                  {#if selectedOutletFilter === "Semua Outlet"}<span>✓</span
                    >{/if}
                </button>
                <button
                  class="outlet-option"
                  class:active={selectedOutletFilter === "Senopati Flagship"}
                  onclick={() => {
                    selectedOutletFilter = "Senopati Flagship";
                    showOutletDropdown = false;
                  }}
                >
                  <span
                    >🏢 Senopati Flagship <small>(Milik Sendiri)</small></span
                  >
                  {#if selectedOutletFilter === "Senopati Flagship"}<span
                      >✓</span
                    >{/if}
                </button>
                <button
                  class="outlet-option"
                  class:active={selectedOutletFilter === "Cabang BSD"}
                  onclick={() => {
                    selectedOutletFilter = "Cabang BSD";
                    showOutletDropdown = false;
                  }}
                >
                  <span>🏢 Cabang BSD GOP 9 <small>(Milik Sendiri)</small></span
                  >
                  {#if selectedOutletFilter === "Cabang BSD"}<span>✓</span>{/if}
                </button>
              {/if}

              {#if partnerFeatureEnabled && (selectedOwnerType === "ALL" || selectedOwnerType === "PARTNER")}
                <button
                  class="outlet-option"
                  class:active={selectedOutletFilter === "Cabang Kemang"}
                  onclick={() => {
                    selectedOutletFilter = "Cabang Kemang";
                    showOutletDropdown = false;
                  }}
                >
                  <span>🤝 Cabang Kemang <small>(Mitra Franchise)</small></span>
                  {#if selectedOutletFilter === "Cabang Kemang"}<span>✓</span
                    >{/if}
                </button>
              {/if}
            </div>
          {/if}
        </div>

        <!-- Date & Time Display (WIB - PRD 2) -->
        <div class="date-time-display">
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <div class="datetime-text">
            <span class="date-str">{currentDate}</span>
            <span class="time-str">{currentTime}</span>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Router View Slot -->
    <main class="page-content" class:is-pos={currentPath === "/pos"}>
      {@render children?.()}
    </main>

    <!-- Bottom Footer Status Indicator (PRD 7.1 Sync Health) -->
    <footer class="app-status-bar">
      <div class="status-left">
        <span
          >HANJO ERP F&B • Sistem Sumber Tunggal Stok & Biaya Multi-Outlet</span
        >
      </div>
      <div class="status-right">
        <span class="status-pulse-dot"></span>
        <span class="status-label"
          >POS Sales Ingestion: Terhubung (Real-Time)</span
        >
      </div>
    </footer>
  </div>
</div>

<!-- Modal Quick Command Palette (Ctrl+K) -->
{#if showCommandPalette}
  <div
    class="command-backdrop"
    role="button"
    tabindex="0"
    onclick={(e) => {
      if (e.target === e.currentTarget) showCommandPalette = false;
    }}
    onkeydown={(e) => e.key === "Escape" && (showCommandPalette = false)}
  >
    <div
      class="command-palette panel-card"
      tabindex="-1"
      role="dialog"
      aria-modal="true"
      aria-label="Pencarian Cepat Menu"
    >
      <div class="command-input-row">
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          bind:this={commandInputRef}
          type="text"
          class="command-input"
          placeholder="Ketik nama halaman, transaksi, atau aksi... (Esc untuk batal)"
          bind:value={commandQuery}
        />
        <kbd class="kbd-badge">ESC</kbd>
      </div>

      <div class="command-results-list">
        {#if filteredCommands.length === 0}
          <div class="empty-results">
            Tidak ada menu atau halaman yang cocok dengan "{commandQuery}".
          </div>
        {:else}
          {#each filteredCommands as item}
            <button
              class="command-result-item"
              onclick={() => selectCommand(item.href)}
            >
              <span class="command-icon">{item.icon}</span>
              <div class="command-meta">
                <strong class="command-title">{item.title}</strong>
                <span class="command-section">{item.section}</span>
              </div>
              <span class="command-arrow">→</span>
            </button>
          {/each}
        {/if}
      </div>

      <div class="command-palette-footer">
        <span
          >Gunakan <strong>↑</strong> <strong>↓</strong> untuk navigasi •
          <strong>Enter</strong>
          untuk memilih • <strong>Esc</strong> tutup</span
        >
      </div>
    </div>
  </div>
{/if}
