from typing import Dict, List
from utils.logger import logger

class GematriaService:
    """Service for gematria calculations and analysis"""

    # Gematria cipher systems
    CIPHERS = {
        "english": {chr(i + 65): i + 1 for i in range(26)},
        "pythagorean": {
            **{chr(i + 65): (i % 9) + 1 for i in range(9)},
            **{chr(i + 74): (i % 9) + 1 for i in range(9)},
            **{chr(i + 83): ((i % 9) + 1) if i < 6 else ((i % 9) + 1) for i in range(8)}
        },
        "chaldean": {
            'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 8, 'G': 3, 'H': 5, 'I': 1,
            'J': 1, 'K': 2, 'L': 3, 'M': 4, 'N': 5, 'O': 7, 'P': 8, 'Q': 1, 'R': 2,
            'S': 3, 'T': 4, 'U': 6, 'V': 6, 'W': 6, 'X': 5, 'Y': 1, 'Z': 7
        }
    }

    def calculate(self, text: str, cipher: str = "english") -> int:
        """Calculate gematria value for text"""
        if cipher not in self.CIPHERS:
            cipher = "english"

        text = text.upper().replace(" ", "")
        total = 0

        for char in text:
            if char in self.CIPHERS[cipher]:
                total += self.CIPHERS[cipher][char]

        return total

    def reduce_to_single(self, number: int) -> int:
        """Reduce number to single digit"""
        while number > 9:
            number = sum(int(d) for d in str(number))
        return number

    async def analyze_game(self, game_data: Dict) -> Dict:
        """Perform gematria analysis on game"""
        home_team = game_data.get("home_team", "")
        away_team = game_data.get("away_team", "")

        analysis = {
            "home_team": self._analyze_text(home_team),
            "away_team": self._analyze_text(away_team),
            "patterns": []
        }

        # Find patterns
        patterns = self._find_patterns(
            analysis["home_team"],
            analysis["away_team"]
        )
        analysis["patterns"] = patterns

        # Gematria prediction (experimental)
        analysis["gematria_favor"] = self._determine_favor(
            analysis["home_team"],
            analysis["away_team"]
        )

        return analysis

    def _analyze_text(self, text: str) -> Dict:
        """Analyze text with all cipher methods"""
        result = {}

        for cipher_name in self.CIPHERS.keys():
            value = self.calculate(text, cipher_name)
            result[cipher_name] = {
                "value": value,
                "reduced": self.reduce_to_single(value)
            }

        return result

    def _find_patterns(self, home_analysis: Dict, away_analysis: Dict) -> List[Dict]:
        """Find numerological patterns"""
        patterns = []

        # Check for equal values
        for cipher in self.CIPHERS.keys():
            home_val = home_analysis[cipher]["value"]
            away_val = away_analysis[cipher]["value"]

            if home_val == away_val:
                patterns.append({
                    "type": "equal_values",
                    "cipher": cipher,
                    "value": home_val,
                    "significance": "high"
                })

            # Check for master numbers (11, 22, 33)
            for team, val in [("home", home_val), ("away", away_val)]:
                if val in [11, 22, 33]:
                    patterns.append({
                        "type": "master_number",
                        "team": team,
                        "value": val,
                        "significance": "medium"
                    })

            # Check difference patterns
            diff = abs(home_val - away_val)
            if diff % 11 == 0:
                patterns.append({
                    "type": "multiple_of_11",
                    "difference": diff,
                    "significance": "medium"
                })

        return patterns

    def _determine_favor(self, home_analysis: Dict, away_analysis: Dict) -> str:
        """Determine which team gematria favors (experimental)"""
        home_score = 0
        away_score = 0

        # Weight different ciphers
        weights = {"english": 1.0, "pythagorean": 1.5, "chaldean": 1.2}

        for cipher, weight in weights.items():
            home_reduced = home_analysis[cipher]["reduced"]
            away_reduced = away_analysis[cipher]["reduced"]

            # Higher reduced value gets points
            if home_reduced > away_reduced:
                home_score += weight
            elif away_reduced > home_reduced:
                away_score += weight

        if home_score > away_score:
            return "home"
        elif away_score > home_score:
            return "away"
        else:
            return "neutral"
