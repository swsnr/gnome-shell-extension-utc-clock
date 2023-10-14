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

import Clutter from "gi://Clutter";
import St from "gi://St";
import GLib from "gi://GLib";
import Gio from "gi://Gio";
import GnomeDesktop from "gi://GnomeDesktop";

import {
  Extension,
  ExtensionMetadata,
} from "resource:///org/gnome/shell/extensions/extension.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";

export default class UTCClockExtension extends Extension {
  private customLabel: St.Label | null = null;

  private clockNotifyId: number | null = null;

  private readonly settings: Gio.Settings;

  constructor(metadata: ExtensionMetadata) {
    super(metadata);
    this.settings = this.getSettings();
    this.settings.connect("changed::clock-format", this.updateLabel.bind(this));
  }

  private get clock(): GnomeDesktop.WallClock {
    return Main.panel.statusArea.dateMenu._clock;
  }

  private get originalLabel(): St.Label {
    return Main.panel.statusArea.dateMenu._clockDisplay;
  }

  private updateLabel() {
    if (this.customLabel !== null) {
      const now = GLib.DateTime.new_now_utc();
      const utcNow = now.format(this.settings.get_string("clock-format"));
      const wallNow = this.clock.clock;
      this.customLabel.set_text(`${wallNow}\u2003${utcNow}`);
    }
  }

  override enable(): void {
    if (this.customLabel === null) {
      this.customLabel = new St.Label({ style_class: "clock" });
      this.customLabel.clutter_text.y_align = Clutter.ActorAlign.CENTER;

      // Insert our custom label beneath the original clock label.  We need to use
      // get_parent here because there are intermediate layout actors; the
      // original label is not an immediate child of the date menu.
      this.originalLabel
        .get_parent()
        ?.insert_child_below(this.customLabel, this.originalLabel);
      this.updateLabel();

      // Hide the original label and make our label the label actor.
      this.originalLabel.set_width(0);
      Main.panel.statusArea.dateMenu.label_actor = this.customLabel;
    }

    if (this.clockNotifyId === null) {
      this.clockNotifyId = this.clock.connect(
        "notify::clock",
        this.updateLabel.bind(this),
      );
    }
  }

  override disable(): void {
    if (this.clockNotifyId !== null) {
      this.clock.disconnect(this.clockNotifyId);
      this.clockNotifyId = null;
    }
    if (this.customLabel !== null) {
      // Restore the original label
      this.originalLabel.set_width(-1);
      Main.panel.statusArea.dateMenu.label_actor = this.originalLabel;
      // Destore our custom label
      this.customLabel.destroy();
      this.customLabel = null;
    }
  }
}
