import { createAudioPlayer, type AudioPlayer } from "expo-audio";
import type { SoundChoice } from "../types";

// The same files the notifications use (see the expo-notifications plugin in app.json),
// loaded here so Settings can play a preview.
const SOURCES: Record<Exclude<SoundChoice, "off">, number> = {
  soft: require("../../assets/sounds/soft.wav"),
  bell: require("../../assets/sounds/bell.wav"),
  pulse: require("../../assets/sounds/pulse.wav"),
};

const players: Partial<Record<SoundChoice, AudioPlayer>> = {};

export function previewSound(choice: SoundChoice): void {
  if (choice === "off") return;
  try {
    let player = players[choice];
    if (!player) {
      player = createAudioPlayer(SOURCES[choice]);
      players[choice] = player;
    }
    player.seekTo(0);
    player.play();
  } catch {
    // A preview that can't play is not worth an error message.
  }
}
