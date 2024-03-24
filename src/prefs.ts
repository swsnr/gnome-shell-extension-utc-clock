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

import { ExtensionPreferences } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

import type { ExtensionMetadata } from "@girs/gnome-shell/extensions/extension";

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

interface ClockPageChildren {
  readonly _dateTimeFormat: Adw.EntryRow;
  readonly _previewLabel: Gtk.Label;
}

const ClockPage = GObject.registerClass(
  {
    GTypeName: "ClockPage",
    Template: getTemplate("ClockPage"),
    InternalChildren: ["dateTimeFormat", "previewLabel"],
  },
  class ClockPage extends Adw.PreferencesPage {
    constructor(settings: Gio.Settings) {
      super();

      const children = this as unknown as ClockPageChildren;

      settings.bind(
        "clock-format",
        children._dateTimeFormat,
        "text",
        Gio.SettingsBindFlags.DEFAULT,
      );

      const previewDateTime = GLib.DateTime.new(
        GLib.TimeZone.new_utc(),
        2006,
        1,
        2,
        15,
        4,
        5,
      );
      const updatePreview = () => {
        const currentFormat = settings.get_string("clock-format");
        if (currentFormat) {
          const preview = previewDateTime.format(currentFormat) ?? "";
          children._previewLabel.set_markup(
            `<span style="italic">${preview}</span>`,
          );
        } else {
          children._previewLabel.set_text("");
        }
      };
      updatePreview();
      settings.connect("changed::clock-format", updatePreview);
    }
  },
);

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
      if (metadata.url) {
        children._linkGithub.set_uri(metadata.url);
        children._linkIssues.set_uri(`${metadata.url}/issues`);
      } else {
        children._linkGithub.visible = false;
        children._linkIssues.visible = false;
      }
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
  }
}
