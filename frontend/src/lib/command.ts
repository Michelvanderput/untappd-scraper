export const OPEN_COMMAND_EVENT = 'beermenu:open-command';

/** Open the ⌘K menu from anywhere (e.g. the search button in the top bar) */
export function openCommandPalette() {
  window.dispatchEvent(new Event(OPEN_COMMAND_EVENT));
}
