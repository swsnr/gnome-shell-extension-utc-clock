// Copyright Sebastian Wiesner <sebastian@swsnr.de>
//
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0.If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Alternatively, the contents of this file may be used under the terms
// of the GNU General Public License Version 2 or later, as described below:
//
// This program is free software; you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation; either version 2 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

import Gio from "gi://Gio";
import Gtk from "gi://Gtk";
import Adw from "gi://Adw";

import { ExtensionPreferences } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

import ClockPage from "./lib/prefs/clock_page.js";
import AboutPage from "./lib/prefs/about_page.js";

interface TracksSettings {
  /**
   * The settings object backing the settings window.
   */
  _settings?: Gio.Settings;
}

export default class UTCClockPreferences extends ExtensionPreferences {
  override fillPreferencesWindow(
    window: Adw.PreferencesWindow & TracksSettings,
  ): Promise<void> {
    // Add our icons directory to the Gtk theme path, so that we're able to use
    // our icons in Adwaita widgets.
    const iconTheme = Gtk.IconTheme.get_for_display(window.get_display());
    const iconsDirectory = this.metadata.dir.get_child("icons").get_path();
    if (iconsDirectory === null) {
      throw new Error("Failed to get path for icon directory");
    }
    iconTheme.add_search_path(iconsDirectory);

    const settings = this.getSettings();
    // Attach the settings object to the window to keep it alive while the window is alive.
    window._settings = settings;

    window.add(new ClockPage(settings));
    window.add(new AboutPage(this.metadata));

    return Promise.resolve();
  }
}
