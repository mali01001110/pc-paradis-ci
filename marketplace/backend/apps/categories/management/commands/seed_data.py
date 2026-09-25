"""Seed data for the catalogue.

Categories, sub-categories, dynamic attribute definitions and brands follow the
spec. Storage stays ONE category (no SSD/NVMe/HDD split). Accented characters
are written as unicode escapes to keep the source file pure ASCII.
"""


def _(s):
    """Decode a unicode-escape string. Defined here for clarity."""
    return s


# Brand names (ASCII)
BRANDS = [
    "NVIDIA", "AMD", "Intel", "ASUS", "MSI", "Gigabyte", "ASRock",
    "Corsair", "Kingston", "Samsung", "Western Digital", "Logitech",
    "Razer", "AOC", "LG", "Xiaomi", "Seagate", "Crucial", "Thermaltake",
    "Cooler Master", "Noctua", "DeepCool", "HyperX", "Zotac", "Palit",
]

# Top-level categories: slug -> (label, icon)
TOP_LEVEL = {
    "composants-internes": ("Composants Internes", "cpu"),
    "composants-externes": ("Composants Externes", "monitor"),
    "accessoires": ("Accessoires", "package"),
}

# Sub-categories per top-level: slug -> label
SUBCATEGORIES = {
    "composants-internes": [
        ("cpu", "Processeurs"),
        ("gpu", "Cartes graphiques"),
        ("carte-mere", "Carte m\u00e8re"),
        ("ram", "RAM"),
        ("stockage", "Stockage"),
        ("alimentation", "Alimentation"),
        ("boitier", "Bo\u00eetier"),
        ("ventilateurs", "Ventilateurs"),
        ("watercooling", "Watercooling"),
        ("refroidissement-cpu", "Refroidissement CPU"),
    ],
    "composants-externes": [
        ("ecrans", "\u00c9crans gaming"),
        ("claviers", "Claviers gaming"),
        ("souris", "Souris gaming"),
        ("casques", "Casques gaming"),
        ("manettes", "Manettes"),
        ("volants", "Volants"),
        ("joysticks", "Joysticks"),
        ("tapis-de-souris", "Tapis de souris"),
        ("chaises-gaming", "Chaises gaming"),
        ("microphones", "Microphones"),
        ("webcams", "Webcams"),
    ],
    "accessoires": [
        ("cables", "C\u00e2bles"),
        ("cables-rgb", "C\u00e2bles RGB"),
        ("adaptateurs", "Adaptateurs"),
        ("accessoires-pc", "Accessoires PC"),
    ],
}

# Attribute definitions per leaf category.
# (key, label, value_type, unit, options, required, filterable)
# value_type: text | number | boolean | select | multiselect
def _attrs(*defs):
    return [list(d) for d in defs]


ATTRIBUTES = {
    # --- CPU (spec section 15) ---
    "cpu": _attrs(
        ("generation", "G\u00e9n\u00e9ration", "text", "", None, False, True),
        ("socket", "Socket", "select", "", ["AM4", "AM5", "LGA1700", "LGA1851", "LGA1200", "LGA1151"], True, True),
        ("cores", "Nombre de c\u0153urs", "number", "", None, True, True),
        ("threads", "Nombre de threads", "number", "", None, True, True),
        ("base_clock", "Fr\u00e9quence de base", "number", "GHz", None, False, True),
        ("boost_clock", "Fr\u00e9quence boost", "number", "GHz", None, False, True),
        ("cache", "Cache", "text", "", None, False, False),
        ("tdp", "TDP", "number", "W", None, False, True),
        ("architecture", "Architecture", "text", "", None, False, False),
        ("lithography", "Lithographie", "text", "", None, False, False),
        ("integrated_gpu", "GPU int\u00e9gr\u00e9", "text", "", None, False, False),
        ("cooler_included", "Refroidissement inclus", "boolean", "", None, False, False),
    ),
    # --- GPU (spec section 16) ---
    "gpu": _attrs(
        ("manufacturer", "Fabricant", "select", "", ["NVIDIA", "AMD", "Intel", "Autre"], True, True),
        ("gpu_chip", "GPU", "text", "", None, True, True),
        ("architecture", "Architecture", "text", "", None, False, False),
        ("vram", "VRAM", "number", "GB", None, True, True),
        ("vram_type", "Type de VRAM", "select", "", ["GDDR6", "GDDR6X", "GDDR5", "HBM"], True, True),
        ("memory_bus", "Largeur du bus", "number", "bits", None, False, False),
        ("boost_clock", "Fr\u00e9quence boost", "number", "MHz", None, False, False),
        ("length", "Longueur", "number", "mm", None, False, False),
        ("power_connectors", "Connecteurs d'alimentation", "text", "", None, False, False),
        ("recommended_psu", "Puissance recommand\u00e9e", "number", "W", None, False, True),
        ("power_consumption", "Consommation", "number", "W", None, False, False),
        ("ray_tracing", "Ray tracing", "boolean", "", None, False, True),
        ("upscaling", "DLSS / FSR / XeSS", "text", "", None, False, False),
        ("video_outputs", "Sorties vid\u00e9o", "text", "", None, False, False),
    ),
    # --- Motherboard (spec section 17) ---
    "carte-mere": _attrs(
        ("socket", "Socket", "text", "", None, True, True),
        ("chipset", "Chipset", "text", "", None, True, True),
        ("format", "Format", "select", "", ["ATX", "Micro-ATX", "Mini-ITX", "E-ATX", "Autre"], True, True),
        ("ram_type", "Type de RAM", "select", "", ["DDR3", "DDR4", "DDR5"], True, True),
        ("ram_slots", "Slots RAM", "number", "", None, True, False),
        ("max_ram", "Capacit\u00e9 RAM maximale", "number", "GB", None, False, False),
        ("m2_slots", "Slots M.2", "number", "", None, False, False),
        ("sata_ports", "Ports SATA", "number", "", None, False, False),
        ("wifi", "Wi-Fi", "boolean", "", None, False, True),
        ("bluetooth", "Bluetooth", "boolean", "", None, False, True),
        ("ethernet", "Ethernet", "text", "", None, False, False),
    ),
    # --- RAM (spec section 18) ---
    "ram": _attrs(
        ("capacity", "Capacit\u00e9 totale", "number", "GB", None, True, True),
        ("sticks", "Nombre de barrettes", "number", "", None, True, False),
        ("per_stick", "Capacit\u00e9 par barrette", "number", "GB", None, False, False),
        ("ram_type", "Type", "select", "", ["DDR3", "DDR4", "DDR5"], True, True),
        ("speed", "Fr\u00e9quence", "number", "MT/s", None, True, True),
        ("cas_latency", "CAS Latency / CL", "text", "", None, True, True),
        ("timings", "Timings complets", "text", "", None, False, False),
        ("voltage", "Tension", "number", "V", None, False, False),
        ("format", "Format", "select", "", ["DIMM", "SO-DIMM"], True, False),
        ("ecc", "ECC", "boolean", "", None, False, False),
        ("xmp", "Profil XMP", "boolean", "", None, False, False),
        ("expo", "Profil EXPO", "boolean", "", None, False, False),
        ("rgb", "RGB", "boolean", "", None, False, True),
        ("heatsink_height", "Hauteur du dissipateur", "number", "mm", None, False, False),
    ),
    # --- Storage (ONE category, spec section 19) ---
    "stockage": _attrs(
        ("storage_type", "Type", "select", "", ["SSD SATA", "SSD NVMe", "HDD"], True, True),
        ("capacity", "Capacit\u00e9", "text", "", None, True, True),
        ("interface", "Interface", "select", "", ["SATA", "PCIe", "USB", "SAS"], True, True),
        ("format", "Format", "text", "", None, False, False),
        ("pcie_gen", "G\u00e9n\u00e9ration PCIe", "select", "", ["Gen3", "Gen4", "Gen5", "N/A"], False, True),
        ("read_speed", "Vitesse de lecture", "number", "MB/s", None, False, True),
        ("write_speed", "Vitesse d'\u00e9criture", "number", "MB/s", None, False, False),
        ("dram", "DRAM", "boolean", "", None, False, False),
        ("tbw", "TBW", "number", "TB", None, False, False),
        ("rpm", "RPM (HDD)", "number", "rpm", None, False, True),
        ("nand", "M\u00e9moire NAND", "text", "", None, False, False),
    ),
    # --- PSU (spec section 20) ---
    "alimentation": _attrs(
        ("power", "Puissance", "number", "W", None, True, True),
        ("certification", "Certification 80 PLUS", "select", "", ["White", "Bronze", "Silver", "Gold", "Platinum", "Titanium"], True, True),
        ("format", "Format", "select", "", ["ATX", "SFX", "SFX-L", "Autre"], True, True),
        ("modular", "Modulaire", "boolean", "", None, True, True),
        ("semi_modular", "Semi-modulaire", "boolean", "", None, False, False),
        ("atx30", "ATX 3.0", "boolean", "", None, False, True),
        ("atx31", "ATX 3.1", "boolean", "", None, False, True),
        ("pcie5", "PCIe 5.0", "boolean", "", None, False, False),
        ("12vhpwr", "Connecteur 12VHPWR", "boolean", "", None, False, False),
        ("12v2x6", "Connecteur 12V-2x6", "boolean", "", None, False, False),
        ("sata_connectors", "Connecteurs SATA", "number", "", None, False, False),
        ("pcie_connectors", "Connecteurs PCIe", "number", "", None, False, False),
        ("length", "Longueur", "number", "mm", None, False, False),
        ("warranty", "Garantie", "text", "", None, False, False),
    ),
    # --- Monitor (spec section 21) ---
    "ecrans": _attrs(
        ("size", "Taille", "number", 'pouces', None, True, True),
        ("resolution", "R\u00e9solution", "select", "", ["1920x1080", "2560x1440", "3840x2160", "2560x1080", "3440x1440", "Autre"], True, True),
        ("refresh_rate", "Fr\u00e9quence", "number", "Hz", None, True, True),
        ("panel_type", "Type de dalle", "select", "", ["IPS", "VA", "TN", "OLED"], True, True),
        ("response_time", "Temps de r\u00e9ponse", "number", "ms", None, False, False),
        ("curved", "Courbure", "boolean", "", None, False, True),
        ("hdr", "HDR", "boolean", "", None, False, True),
        ("freesync", "FreeSync", "boolean", "", None, False, True),
        ("gsync", "G-Sync", "boolean", "", None, False, True),
        ("hdmi_ports", "Ports HDMI", "number", "", None, False, False),
        ("displayport_ports", "Ports DisplayPort", "number", "", None, False, False),
    ),
    # --- Keyboard (spec section 22) ---
    "claviers": _attrs(
        ("layout", "Layout", "select", "", ["AZERTY", "QWERTY"], True, True),
        ("format", "Format", "select", "", ["60%", "65%", "75%", "TKL", "Full size", "Autre"], True, True),
        ("switch_type", "Type de switch", "text", "", None, True, True),
        ("connection", "Connexion", "select", "", ["Filaire", "Sans fil", "Filaire + sans fil"], True, True),
        ("bluetooth", "Bluetooth", "boolean", "", None, False, True),
        ("wireless_24g", "2.4 GHz", "boolean", "", None, False, False),
        ("backlight", "R\u00e9tro\u00e9clairage", "boolean", "", None, False, False),
        ("rgb", "RGB", "boolean", "", None, False, True),
        ("hot_swappable", "Hot-swappable", "boolean", "", None, False, True),
    ),
    # --- Mouse (spec section 23) ---
    "souris": _attrs(
        ("dpi", "DPI", "number", "DPI", None, True, True),
        ("sensor", "Capteur", "text", "", None, True, True),
        ("polling_rate", "Polling rate", "number", "Hz", None, False, False),
        ("buttons", "Nombre de boutons", "number", "", None, False, False),
        ("weight", "Poids", "number", "g", None, False, False),
        ("connection", "Connexion", "select", "", ["Filaire", "Sans fil", "Filaire + sans fil"], True, True),
        ("rgb", "RGB", "boolean", "", None, False, True),
    ),
    # --- Controller (spec section 24) ---
    "manettes": _attrs(
        ("platform", "Plateforme compatible", "text", "", None, True, True),
        ("connection", "Connexion", "select", "", ["Filaire", "Sans fil", "Filaire + sans fil"], True, True),
        ("bluetooth", "Bluetooth", "boolean", "", None, False, False),
        ("vibration", "Vibration", "boolean", "", None, False, False),
        ("buttons", "Nombre de boutons", "number", "", None, False, False),
        ("pc_compatible", "Compatibilit\u00e9 PC", "boolean", "", None, False, True),
        ("battery_life", "Autonomie", "number", "h", None, False, False),
    ),
    # --- Case (spec section 25) ---
    "boitier": _attrs(
        ("format", "Format", "select", "", ["ATX", "Micro-ATX", "Mini-ITX", "E-ATX", "Autre"], True, True),
        ("max_gpu", "GPU maximum", "number", "mm", None, False, False),
        ("max_cooler", "CPU cooler maximum", "number", "mm", None, False, False),
        ("included_fans", "Ventilateurs inclus", "number", "", None, False, False),
        ("usb_c", "USB-C", "boolean", "", None, False, True),
        ("glass_panel", "Panneau en verre tremp\u00e9", "boolean", "", None, False, True),
        ("dimensions", "Dimensions", "text", "", None, False, False),
    ),
}
