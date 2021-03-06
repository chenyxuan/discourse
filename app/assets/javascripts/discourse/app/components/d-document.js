import Component from "@ember/component";
import { inject as service } from "@ember/service";
import { bind } from "discourse-common/utils/decorators";
import logout from "discourse/lib/logout";
import I18n from "I18n";
import { setLogoffCallback } from "discourse/lib/ajax";
import bootbox from "bootbox";

export default Component.extend({
  tagName: "",
  documentTitle: service(),
  _showingLogout: false,

  didInsertElement() {
    this._super(...arguments);

    this.documentTitle.setTitle(document.title);
    document.addEventListener("visibilitychange", this._focusChanged);
    document.addEventListener("resume", this._focusChanged);
    document.addEventListener("freeze", this._focusChanged);
    this.session.hasFocus = true;

    this.appEvents.on("notifications:changed", this, this._updateNotifications);
    setLogoffCallback(() => this.displayLogoff());
  },

  willDestroyElement() {
    this._super(...arguments);

    setLogoffCallback(null);
    document.removeEventListener("visibilitychange", this._focusChanged);
    document.removeEventListener("resume", this._focusChanged);
    document.removeEventListener("freeze", this._focusChanged);

    this.appEvents.off(
      "notifications:changed",
      this,
      this._updateNotifications
    );
  },

  _updateNotifications() {
    if (!this.currentUser) {
      return;
    }

    this.documentTitle.updateNotificationCount(
      this.currentUser.unread_notifications +
        this.currentUser.unread_high_priority_notifications
    );
  },

  @bind
  _focusChanged() {
    if (document.visibilityState === "hidden") {
      if (this.session.hasFocus) {
        this.documentTitle.setFocus(false);
      }
    } else if (!this.hasFocus) {
      this.documentTitle.setFocus(true);
    }
  },

  displayLogoff() {
    if (this._showingLogout) {
      return;
    }

    this._showingLogout = true;
    this.messageBus.stop();
    bootbox.dialog(
      I18n.t("logout"),
      { label: I18n.t("refresh"), callback: logout },
      {
        onEscape: () => logout(),
        backdrop: "static",
      }
    );
  },
});
