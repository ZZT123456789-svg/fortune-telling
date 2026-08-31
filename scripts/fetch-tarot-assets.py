"""Vendor the MIT tarot dataset and public-domain RWS card artwork."""

from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import time
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]


def fetch(url: str) -> bytes:
    error = None
    for attempt in range(4):
        try:
            request = Request(url, headers={"User-Agent": "DaoWen-Tarot-Asset-Vendor/1.0"})
            with urlopen(request, timeout=90) as response:
                return response.read()
        except Exception as exc:  # Network retries are intentional for Wikimedia.
            error = exc
            time.sleep(attempt + 1)
    raise error


def main() -> None:
    data_dir = ROOT / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    dataset_url = (
        "https://raw.githubusercontent.com/Tarotoo-com/"
        "tarotoo-tarot-dataset/main/data/cards.json"
    )
    payload = fetch(dataset_url)
    (data_dir / "tarot-cards.en.json").write_bytes(payload)
    print(f"downloaded dataset: {len(payload)} bytes")

    source = "https://raw.githubusercontent.com/J-York/TarotWhisper/main/public/cards"
    major_names = [
        "fool", "magician", "priestess", "empress", "emperor", "hierophant",
        "lovers", "chariot", "strength", "hermit", "fortune", "justice",
        "hanged", "death", "temperance", "devil", "tower", "star", "moon",
        "sun", "judgement", "world",
    ]
    normalized = {"priestess": "high-priestess", "fortune": "wheel-of-fortune", "hanged": "hanged-man"}
    urls = {
        index: f"{source}/major/{index:02d}-{normalized.get(name, name)}.jpg"
        for index, name in enumerate(major_names)
    }
    card_id = 22
    for suit in ["wands", "cups", "swords", "pentacles"]:
        for rank in range(1, 15):
            urls[card_id] = f"{source}/minor/{suit}/{rank:02d}.jpg"
            card_id += 1

    cards_dir = ROOT / "assets" / "tarot" / "cards"
    cards_dir.mkdir(parents=True, exist_ok=True)

    def download_image(item: tuple[int, str]) -> tuple[int, int]:
        card_id, url = item
        destination = cards_dir / f"{card_id:02d}.jpg"
        if destination.exists() and destination.stat().st_size > 10_000:
            return card_id, destination.stat().st_size
        image = fetch(url)
        if len(image) < 10_000:
            raise RuntimeError(f"image {card_id} is unexpectedly small: {len(image)} bytes")
        destination.write_bytes(image)
        return card_id, len(image)

    with ThreadPoolExecutor(max_workers=3) as pool:
        completed = sorted(pool.map(download_image, urls.items()))
    print(f"downloaded RWS artwork: {len(completed)} cards")


if __name__ == "__main__":
    main()
