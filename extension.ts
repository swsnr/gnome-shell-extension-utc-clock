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

import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";

class EnabledExtension {
  readonly label: St.Label;

  private readonly clockNotifyId: number;

  private readonly settingsChangedId: number;

  private readonly settings: Gio.Settings;

  constructor(settings: Gio.Settings) {
    this.label = new St.Label({ style_class: "clock" });
    this.label.clutter_text.y_align = Clutter.ActorAlign.CENTER;

    this.settings = settings;
    this.settingsChangedId = this.settings.connect(
      "changed::clock-format",
      this.updateLabel.bind(this),
    );

    this.clockNotifyId = this.wallClock.connect(
      "notify::clock",
      this.updateLabel.bind(this),
    );
  }

  private get wallClock(): GnomeDesktop.WallClock {
    return Main.panel.statusArea.dateMenu._clock;
  }

  updateLabel() {
    const now = GLib.DateTime.new_now_utc();
    const utcNow = now.format(this.settings.get_string("clock-format"));
    this.label.set_text(`${this.wallClock.clock}\u2003${utcNow}`);
  }

  destroy() {
    this.settings.disconnect(this.settingsChangedId);
    this.wallClock.disconnect(this.clockNotifyId);
    this.label.destroy();
  }
}

export default class UTCClockExtension extends Extension {
  private enabledExtension: EnabledExtension | null = null;

  private get originalLabel(): St.Label {
    return Main.panel.statusArea.dateMenu._clockDisplay;
  }

  override enable(): void {
    if (this.enabledExtension === null) {
      this.enabledExtension = new EnabledExtension(this.getSettings());
      // Insert our custom label beneath the original clock label.  We need to use
      // get_parent here because there are intermediate layout actors; the
      // original label is not an immediate child of the date menu.
      this.originalLabel
        .get_parent()
        ?.insert_child_below(this.enabledExtension.label, this.originalLabel);
      this.enabledExtension.updateLabel();

      // Hide the original label and make our label the label actor.
      this.originalLabel.set_width(0);
      Main.panel.statusArea.dateMenu.label_actor = this.enabledExtension.label;
    }
  }

  override disable(): void {
    if (this.enabledExtension !== null) {
      // Restore the original label
      this.originalLabel.set_width(-1);
      Main.panel.statusArea.dateMenu.label_actor = this.originalLabel;
      // Destroy our extension
      this.enabledExtension.destroy();
      this.enabledExtension = null;
    }
  }
}
