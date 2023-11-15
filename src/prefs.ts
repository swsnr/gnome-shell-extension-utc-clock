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

import GLib from "gi://GLib";
import Gio from "gi://Gio";
import Gtk from "gi://Gtk";
import Adw from "gi://Adw";

import { ExtensionPreferences } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

interface TracksSettings {
  /**
   * The settings object backing the settings window.
   */
  _settings?: Gio.Settings;
}

export default class UTCClockPreferences extends ExtensionPreferences {
  private loadUI(name: string): Gtk.Builder | null {
    const path = this.metadata.dir.get_child("ui").get_child(name).get_path();
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
    const settings = this.getSettings();

    // Attach the settings object to the window to keep it alive while the window is alive.
    window._settings = settings;

    const settingsPage = new Adw.PreferencesPage({
      title: "Clock",
      icon_name: "x-office-calendar-symbolic",
    });
    window.add(settingsPage);
    const settingsGroup = new Adw.PreferencesGroup();
    settingsPage.add(settingsGroup);

    const previewDateTime = GLib.DateTime.new(
      GLib.TimeZone.new_utc(),
      2006,
      1,
      2,
      15,
      4,
      5,
    );
    const previewLabel = Gtk.Label.new("");
    const updatePreview = () => {
      const currentFormat = settings.get_string("clock-format");
      if (currentFormat) {
        previewLabel.set_markup(
          `<span style="italic">${previewDateTime.format(
            currentFormat,
          )}</span>`,
        );
      } else {
        previewLabel.set_text("");
      }
    };
    updatePreview();
    settings.connect("changed::clock-format", updatePreview);

    const dateTimeFormatRow = new Adw.EntryRow({
      title: "Format string",
    });
    settingsGroup.add(dateTimeFormatRow);
    dateTimeFormatRow.add_suffix(previewLabel);
    settings.bind(
      "clock-format",
      dateTimeFormatRow,
      "text",
      Gio.SettingsBindFlags.DEFAULT,
    );
    const utcOffsetSpinRow = new Adw.SpinRow ({
      title: "Time Zone Offset",
      adjustment: new Gtk.Adjustment({
          lower: -11,
          upper: 14,
          step_increment: 1,
          page_increment: 3
      }),
    });
    settingsGroup.add(utcOffsetSpinRow);
    settings.bind(
      "utc-offset",
      utcOffsetSpinRow,
      "value",
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
    if (aboutUI && aboutWidget) {
      aboutGroup.add(aboutWidget as Gtk.Widget);

      const name = aboutUI.get_object("name") as Gtk.Label | null;
      name?.set_text(this.metadata.name);
      const description = aboutUI.get_object("description") as Gtk.Label | null;
      description?.set_text(this.metadata.description);
      const github = aboutUI.get_object("github") as Gtk.LinkButton | null;
      github?.set_uri(this.metadata.url);
      const issues = aboutUI.get_object("issues") as Gtk.LinkButton | null;
      issues?.set_uri(`${this.metadata.url}/issues`);

      const licenseText = aboutUI.get_object("license") as Gtk.TextView | null;
      licenseText?.buffer.set_text(
        `Copyright Sebastian Wiesner <sebastian@swsnr.de>

This programm is subject to the terms of the Mozilla Public
License, v. 2.0.If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.

Alternatively, this program may be used under the terms
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
