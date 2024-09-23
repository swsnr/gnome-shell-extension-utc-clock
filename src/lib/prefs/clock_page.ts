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

import { getTemplate } from "./template.js";

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
interface UTCClockClockPage {
  readonly _dateTimeFormat: Adw.EntryRow;
  readonly _previewLabel: Gtk.Label;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
class UTCClockClockPage extends Adw.PreferencesPage {
  constructor(settings: Gio.Settings) {
    super();

    settings.bind(
      "clock-format",
      this._dateTimeFormat,
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
        this._previewLabel.set_markup(`<span style="italic">${preview}</span>`);
      } else {
        this._previewLabel.set_text("");
      }
    };
    updatePreview();
    settings.connect("changed::clock-format", updatePreview);
  }
}

export default GObject.registerClass(
  {
    GTypeName: "UTCClockClockPage",
    Template: getTemplate("ClockPage"),
    InternalChildren: ["dateTimeFormat", "previewLabel"],
  },
  UTCClockClockPage,
);
