import json
import logging
from typing import Optional, Dict, Any
import requests
from app.core.config import settings

logger = logging.getLogger("ctf_studio.llm_client")

class LLMClientService:
    @staticmethod
    def get_active_provider_and_key(override_provider: Optional[str] = None, override_key: Optional[str] = None):
        provider = (override_provider or settings.AI_PROVIDER or "local").lower()
        key = override_key
        if not key:
            if provider == "gemini":
                key = settings.GEMINI_API_KEY
            elif provider == "openai":
                key = settings.OPENAI_API_KEY
            elif provider == "anthropic":
                key = settings.ANTHROPIC_API_KEY
        return provider, key

    @staticmethod
    def call_gemini(prompt: str, system_instruction: str, api_key: str, model: str = "gemini-2.0-flash") -> Optional[str]:
        if not api_key:
            return None
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": f"SYSTEM INSTRUCTION: {system_instruction}\n\nUSER PROMPT: {prompt}"}
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 4096
            }
        }
        try:
            resp = requests.post(url, headers=headers, json=payload, timeout=20)
            if resp.status_code == 200:
                data = resp.json()
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        return parts[0].get("text", "")
            logger.warning(f"Gemini API returned status {resp.status_code}: {resp.text[:200]}")
            return None
        except Exception as e:
            logger.error(f"Gemini API request failed: {e}")
            return None

    @staticmethod
    def call_openai(prompt: str, system_instruction: str, api_key: str, model: str = "gpt-4o-mini") -> Optional[str]:
        if not api_key:
            return None
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        }
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.2,
            "max_tokens": 4096
        }
        try:
            resp = requests.post(url, headers=headers, json=payload, timeout=20)
            if resp.status_code == 200:
                data = resp.json()
                choices = data.get("choices", [])
                if choices:
                    return choices[0].get("message", {}).get("content", "")
            logger.warning(f"OpenAI API returned status {resp.status_code}: {resp.text[:200]}")
            return None
        except Exception as e:
            logger.error(f"OpenAI API request failed: {e}")
            return None

    @staticmethod
    def call_anthropic(prompt: str, system_instruction: str, api_key: str, model: str = "claude-3-5-sonnet-20241022") -> Optional[str]:
        if not api_key:
            return None
        url = "https://api.anthropic.com/v1/messages"
        headers = {
            "Content-Type": "application/json",
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01"
        }
        payload = {
            "model": model,
            "system": system_instruction,
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "max_tokens": 4096,
            "temperature": 0.2
        }
        try:
            resp = requests.post(url, headers=headers, json=payload, timeout=20)
            if resp.status_code == 200:
                data = resp.json()
                content = data.get("content", [])
                if content:
                    return content[0].get("text", "")
            logger.warning(f"Anthropic API returned status {resp.status_code}: {resp.text[:200]}")
            return None
        except Exception as e:
            logger.error(f"Anthropic API request failed: {e}")
            return None

    @classmethod
    def generate_text(cls, prompt: str, system_instruction: str, provider: Optional[str] = None, api_key: Optional[str] = None) -> Optional[str]:
        active_provider, active_key = cls.get_active_provider_and_key(provider, api_key)
        if not active_key or active_provider == "local":
            return None

        if "gemini" in active_provider:
            return cls.call_gemini(prompt, system_instruction, active_key)
        elif "openai" in active_provider or "gpt" in active_provider:
            return cls.call_openai(prompt, system_instruction, active_key)
        elif "anthropic" in active_provider or "claude" in active_provider:
            return cls.call_anthropic(prompt, system_instruction, active_key)
        return None

    @classmethod
    def test_key(cls, provider: str, api_key: str) -> Dict[str, Any]:
        prompt = "Ping. Reply with strictly: PONG"
        system = "You are a connectivity test agent. Reply with strictly: PONG"
        result = None
        if "gemini" in provider.lower():
            result = cls.call_gemini(prompt, system, api_key)
        elif "openai" in provider.lower() or "gpt" in provider.lower():
            result = cls.call_openai(prompt, system, api_key)
        elif "anthropic" in provider.lower() or "claude" in provider.lower():
            result = cls.call_anthropic(prompt, system, api_key)

        if result:
            return {
                "success": True,
                "provider": provider,
                "message": f"Successfully verified {provider} connection",
                "sample_output": result.strip()[:100]
            }
        else:
            return {
                "success": False,
                "provider": provider,
                "message": f"Failed to connect to {provider}. Please verify the API key."
            }
