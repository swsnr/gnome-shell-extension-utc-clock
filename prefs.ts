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

import Gtk from "gi://Gtk";
import Adw from "gi://Adw";
import Gio from "gi://Gio";

import { ExtensionPreferences } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

interface TracksSettings {
  /**
   * The settings object backing the settings window.
   */
  _settings?: Gio.Settings;
}

export default class UTCClockPreferences extends ExtensionPreferences {
  private loadUI(name: string): Gtk.Builder | null {
    const path = this.metadata.dir.get_child(name).get_path();
    if (!path) {
      return null;
    }
    try {
      return Gtk.Builder.new_from_file(path);
    } catch (error) {
      console.error("Failed to load:", path, error);
      return null;
    }
  }

  override fillPreferencesWindow(
    window: Adw.PreferencesWindow & TracksSettings,
  ): void {
    // Create a settings object and bind the row to our key.
    // Attach the settings object to the window to keep it alive while the window is alive.
    window._settings = this.getSettings();

    const settingsPage = new Adw.PreferencesPage({
      title: "Clock",
      icon_name: "x-office-calendar-symbolic",
    });
    window.add(settingsPage);
    const settingsGroup = new Adw.PreferencesGroup();
    settingsPage.add(settingsGroup);

    const dateTimeFormatRow = new Adw.EntryRow({
      title: "Date Time format string",
    });
    settingsGroup.add(dateTimeFormatRow);
    window._settings.bind(
      "clock-format",
      dateTimeFormatRow,
      "text",
      Gio.SettingsBindFlags.DEFAULT,
    );

    const aboutPage = new Adw.PreferencesPage({
      title: "About",
      icon_name: "dialog-information-symbolic",
    });
    window.add(aboutPage);

    const aboutGroup = new Adw.PreferencesGroup();
    aboutPage.add(aboutGroup);

    const aboutUI = this.loadUI("about.ui");
    const aboutWidget = aboutUI?.get_object("about");
    if (aboutWidget) {
      aboutGroup.add(aboutWidget as Gtk.Widget);
      const licenseText = aboutUI?.get_object("license") as Gtk.TextView | null;
      licenseText?.buffer.set_text(
        `Copyright Sebastian Wiesner <sebastian@swsnr.de>

This programm is subject to the terms of the Mozilla Public
License, v. 2.0.If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.

Alternatively, the contents of this file may be used under the terms
of the GNU General Public License Version 2 or later, as described below:

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.`,
        -1,
      );
    }
  }
}
