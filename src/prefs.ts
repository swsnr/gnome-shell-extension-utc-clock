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

import GObject from "gi://GObject";
import GLib from "gi://GLib";
import Gio from "gi://Gio";
import Gtk from "gi://Gtk";
import Adw from "gi://Adw";

import {
  ExtensionPreferences,
  ExtensionMetadata,
} from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

const getTemplate = (name: string): string => {
  const uri = GLib.uri_resolve_relative(
    import.meta.url,
    `ui/${name}.ui`,
    GLib.UriFlags.NONE,
  );
  if (uri === null) {
    throw new Error(`Failed to resolve URI for template ${name}!`);
  }
  return uri;
};

const LICENSE = `Copyright Sebastian Wiesner <sebastian@swsnr.de>

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
GNU General Public License for more details.`;

interface AboutPageChildren {
  readonly _extensionName: Gtk.Label;
  readonly _extensionDescription: Gtk.Label;
  readonly _extensionVersion: Gtk.Label;
  readonly _linkGithub: Gtk.LinkButton;
  readonly _linkIssues: Gtk.LinkButton;
  readonly _extensionLicense: Gtk.TextView;
}

const AboutPage = GObject.registerClass(
  {
    GTypeName: "AboutPage",
    Template: getTemplate("AboutPage"),
    InternalChildren: [
      "extensionName",
      "extensionVersion",
      "linkGithub",
      "linkIssues",
      "extensionLicense",
    ],
  },
  class AboutPage extends Adw.PreferencesPage {
    constructor(metadata: ExtensionMetadata) {
      super();

      const children = this as unknown as AboutPageChildren;
      children._extensionName.set_text(metadata.name);
      if (metadata["version-name"]) {
        children._extensionVersion.set_text(metadata["version-name"]);
      } else {
        children._extensionVersion.visible = false;
      }
      children._linkGithub.set_uri(metadata.url);
      children._linkIssues.set_uri(`${metadata.url}/issues`);
      children._extensionLicense.buffer.set_text(LICENSE, -1);
    }
  },
);

interface TracksSettings {
  /**
   * The settings object backing the settings window.
   */
  _settings?: Gio.Settings;
}

export default class UTCClockPreferences extends ExtensionPreferences {
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

    window.add(new AboutPage(this.metadata));
  }
}
