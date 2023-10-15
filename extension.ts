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

/**
 * The state of the enabled extension.
 */
class EnabledExtension {
  /**
   * Our clock display label, which we use instead of the original label.
   */
  readonly label: St.Label;

  /**
   * The ID of the signal connection which listens for updates of the GNOME wall clock.
   *
   * We update our clock display whenever the wall clock updates itself.
   */
  private readonly clockNotifyId: number;

  /**
   * The ID of the signal connection which listens for updates of the clock format.
   *
   * We update our clock display whenever the user changes the format in which
   * to display the UTC time.
   */
  private readonly settingsChangedId: number;

  /**
   * The settings of this extension.
   */
  private readonly settings: Gio.Settings;

  /**
   * Create a new enabled extension.
   *
   * Creates a label to display the wall clock along with our UTC clock, and
   * connect to wall clock updates as well as settings changes to update the
   * clock as it ticks, or whenever the user changes the time format to use.
   *
   * @param settings The settings of this extension
   */
  constructor(settings: Gio.Settings) {
    this.label = new St.Label({ style_class: "clock" });
    this.label.clutter_text.y_align = Clutter.ActorAlign.CENTER;

    this.settings = settings;
    this.settingsChangedId = this.settings.connect(
      "changed::clock-format",
      this.updateClockDisplay.bind(this),
    );

    this.clockNotifyId = this.wallClock.connect(
      "notify::clock",
      this.updateClockDisplay.bind(this),
    );
  }

  /**
   * Convenience accessor for the wall clock which provides the time on the date menu utton.
   */
  private get wallClock(): GnomeDesktop.WallClock {
    return Main.panel.statusArea.dateMenu._clock;
  }

  /**
   * Update our clock display.
   *
   * Shows the GNOME wall clock time and the UTC time in the format configured
   * for this extension.
   */
  updateClockDisplay() {
    const now = GLib.DateTime.new_now_utc();
    const utcNow = now.format(this.settings.get_string("clock-format"));
    this.label.set_text(`${this.wallClock.clock}\u2003${utcNow}`);
  }

  /**
   * Destroy this extension.
   *
   * Disconnects from all signals, and destroys our label actor.
   */
  destroy() {
    this.settings.disconnect(this.settingsChangedId);
    this.wallClock.disconnect(this.clockNotifyId);
    this.label.destroy();
  }
}

/**
 * A GNOME shell extension which adds a customizable UTC clock to the date menu button.
 */
export default class UTCClockExtension extends Extension {
  /**
   * The state of the enabled extension, or `null` if the extension is disabled.
   */
  private enabledExtension: EnabledExtension | null = null;

  /**
   * Convenience getter for the original label of the date menu.
   */
  private get originalLabel(): St.Label {
    return Main.panel.statusArea.dateMenu._clockDisplay;
  }

  /**
   * Enable this extension.
   *
   * Create a new label for our custom clock, and hide the original date menu
   * label.
   */
  override enable(): void {
    if (this.enabledExtension === null) {
      this.enabledExtension = new EnabledExtension(this.getSettings());
      // Insert our custom label beneath the original clock label.  We need to use
      // get_parent here because there are intermediate layout actors; the
      // original label is not an immediate child of the date menu.
      this.originalLabel
        .get_parent()
        ?.insert_child_below(this.enabledExtension.label, this.originalLabel);
      this.enabledExtension.updateClockDisplay();

      // Hide the original label and make our label the label actor.
      this.originalLabel.set_width(0);
      Main.panel.statusArea.dateMenu.label_actor = this.enabledExtension.label;
    }
  }

  /**
   * Disable this extension.
   *
   * Restore the original date menu label, and destroy the entire extension state.
   */
  override disable(): void {
    if (this.enabledExtension !== null) {
      // Restore the original label
      this.originalLabel.set_width(-1);
      Main.panel.statusArea.dateMenu.label_actor = this.originalLabel;
      // Destroy our extension, and null the reference to make sure everything
      // gets cleaned up properly.
      this.enabledExtension.destroy();
      this.enabledExtension = null;
    }
  }
}
