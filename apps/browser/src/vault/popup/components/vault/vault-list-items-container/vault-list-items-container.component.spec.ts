import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { Router } from "@angular/router";
import { mock } from "jest-mock-extended";
import { BehaviorSubject, of } from "rxjs";

import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";
import { CipherType } from "@bitwarden/common/vault/enums";
import { CompactModeService, DialogService } from "@bitwarden/components";
import { PasswordRepromptService } from "@bitwarden/vault";

import { VaultPopupAutofillService } from "../../../services/vault-popup-autofill.service";
import { VaultPopupSectionService } from "../../../services/vault-popup-section.service";
import { PopupCipherViewLike } from "../../../views/popup-cipher.view";

import { VaultListItemsContainerComponent } from "./vault-list-items-container.component";

describe("VaultListItemsContainerComponent", () => {
  let fixture: ComponentFixture<VaultListItemsContainerComponent>;
  let component: VaultListItemsContainerComponent;

  const currentTabIsOnBlocklist$ = new BehaviorSubject<boolean>(false);
  const platformUtilsService = mock<PlatformUtilsService>();

  const mockCipher = {
    id: "cipher-1",
    name: "Test Login",
    type: CipherType.Login,
    login: {
      username: "user@example.com",
      uris: [{ uri: "https://example.com", match: null }],
    },
    favorite: false,
    reprompt: 0,
    organizationId: null,
    collectionIds: [],
    edit: true,
    viewPassword: true,
  } as any;

  const vaultPopupAutofillService = {
    currentTabIsOnBlocklist$: currentTabIsOnBlocklist$.asObservable(),
    doAutofill: jest.fn(),
  };

  const compactModeService = {
    enabled$: of(false),
  };

  const vaultPopupSectionService = {
    getOpenDisplayStateForSection: jest.fn().mockReturnValue(() => true),
    updateSectionOpenStoredState: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    currentTabIsOnBlocklist$.next(false);
    platformUtilsService.getAutofillKeyboardShortcut.mockResolvedValue("");

    await TestBed.configureTestingModule({
      imports: [VaultListItemsContainerComponent, NoopAnimationsModule],
      providers: [
        { provide: VaultPopupAutofillService, useValue: vaultPopupAutofillService },
        { provide: CompactModeService, useValue: compactModeService },
        { provide: VaultPopupSectionService, useValue: vaultPopupSectionService },
        { provide: I18nService, useValue: { t: (k: string) => k } },
        { provide: AccountService, useValue: { activeAccount$: of({ id: "UserId" }) } },
        { provide: CipherService, useValue: mock<CipherService>() },
        { provide: Router, useValue: { navigate: jest.fn() } },
        { provide: PasswordRepromptService, useValue: mock<PasswordRepromptService>() },
        { provide: PlatformUtilsService, useValue: platformUtilsService },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
      .overrideProvider(DialogService, { useValue: mock<DialogService>() })
      .compileComponents();

    fixture = TestBed.createComponent(VaultListItemsContainerComponent);
    component = fixture.componentInstance;
  });

  describe("item actions", () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it("should show fill text on hover for autofill list items", () => {
      fixture.componentRef.setInput("isAutofillList", true);
      fixture.detectChanges();

      expect(component.showFillTextOnHover()).toBe(true);
    });

    it("should not show fill text on hover for non-autofill list items", () => {
      fixture.componentRef.setInput("isAutofillList", false);
      fixture.detectChanges();

      expect(component.showFillTextOnHover()).toBe(false);
    });

    it("should hide launch button for autofill list items", () => {
      fixture.componentRef.setInput("isAutofillList", true);
      fixture.detectChanges();

      expect(component.showLaunchButton()).toBe(false);
    });

    it("should show launch button for non-autofill list items", () => {
      fixture.componentRef.setInput("isAutofillList", false);
      fixture.detectChanges();

      expect(component.showLaunchButton()).toBe(true);
    });

    it("should show autofill in menu for non-autofill list items", () => {
      fixture.componentRef.setInput("isAutofillList", false);
      fixture.detectChanges();

      expect(component.showAutofillInMenu()).toBe(true);
    });

    it("should hide autofill in menu for autofill list items", () => {
      fixture.componentRef.setInput("isAutofillList", true);
      fixture.detectChanges();

      expect(component.showAutofillInMenu()).toBe(false);
    });

    it("should show view in menu for autofill list items", () => {
      fixture.componentRef.setInput("isAutofillList", true);
      fixture.detectChanges();

      expect(component.showViewInMenu()).toBe(true);
    });

    it("should hide view in menu for non-autofill list items", () => {
      fixture.componentRef.setInput("isAutofillList", false);
      fixture.detectChanges();

      expect(component.showViewInMenu()).toBe(false);
    });

    it("should autofill on select for autofill list items", () => {
      fixture.componentRef.setInput("isAutofillList", true);
      fixture.detectChanges();

      expect(component.canAutofill()).toBe(true);
    });

    it("should not autofill on select for non-autofill list items", () => {
      fixture.componentRef.setInput("isAutofillList", false);
      fixture.detectChanges();

      expect(component.canAutofill()).toBe(false);
    });

    describe("when current URI is blocked", () => {
      beforeEach(() => {
        currentTabIsOnBlocklist$.next(true);
        fixture.detectChanges();
      });

      it("should not autofill on select even when isAutofillList is true", () => {
        fixture.componentRef.setInput("isAutofillList", true);
        fixture.detectChanges();

        expect(component.canAutofill()).toBe(false);
      });
    });

    describe("when click-to-fill is turned off", () => {
      beforeEach(() => {
        fixture.componentRef.setInput("isAutofillList", true);
        fixture.componentRef.setInput("clickItemsToAutofill", false);
        fixture.detectChanges();
      });

      it("should open the item on select instead of autofilling", () => {
        expect(component.canAutofill()).toBe(false);
        expect(component.showFillTextOnHover()).toBe(false);
      });

      it("should show the standalone Fill button", () => {
        expect(component.showAutofillBadge()).toBe(true);
      });

      it("should not offer Autofill or View in the more options menu", () => {
        expect(component.showAutofillInMenu()).toBe(false);
        expect(component.showViewInMenu()).toBe(false);
      });

      it("should hide the Fill button when the current URI is blocked", () => {
        currentTabIsOnBlocklist$.next(true);
        fixture.detectChanges();

        expect(component.showAutofillBadge()).toBe(false);
      });
    });

    it("should not show the standalone Fill button when click-to-fill is on", () => {
      fixture.componentRef.setInput("isAutofillList", true);
      fixture.detectChanges();

      expect(component.showAutofillBadge()).toBe(false);
    });
  });

  describe("Fill button shortcut tooltip", () => {
    const tooltip = () => (component as any).autofillShortcutTooltip();

    const showBadge = async () => {
      fixture.componentRef.setInput("isAutofillList", true);
      fixture.componentRef.setInput("clickItemsToAutofill", false);
      fixture.detectChanges();
      await fixture.whenStable();
    };

    it("does not look up the shortcut while click-to-fill is on", async () => {
      fixture.componentRef.setInput("isAutofillList", true);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(platformUtilsService.getAutofillKeyboardShortcut).not.toHaveBeenCalled();
    });

    it("shows the shortcut when one is assigned", async () => {
      platformUtilsService.getAutofillKeyboardShortcut.mockResolvedValue("Ctrl+Shift+L");
      await showBadge();

      expect(platformUtilsService.getAutofillKeyboardShortcut).toHaveBeenCalledTimes(1);
      expect(tooltip()).toBe("autofillVerb Ctrl+Shift+L");
    });

    it.each([[""], [undefined]])("falls back when the shortcut is %p", async (shortcut) => {
      platformUtilsService.getAutofillKeyboardShortcut.mockResolvedValue(shortcut as any);
      await showBadge();

      expect(tooltip()).toBeUndefined();
    });

    it("falls back when the shortcut lookup fails", async () => {
      platformUtilsService.getAutofillKeyboardShortcut.mockRejectedValue(new Error("no commands"));
      await showBadge();

      expect(tooltip()).toBeUndefined();
    });
  });

  describe("cipherItemTitleKey", () => {
    it("should return autofillTitle when canAutofill is true", () => {
      fixture.componentRef.setInput("isAutofillList", true);
      fixture.detectChanges();

      const titleKeyFn = component.cipherItemTitleKey();
      const result = titleKeyFn(mockCipher);

      expect(result).toBe("autofillTitleWithField");
    });

    it("should return viewItemTitle when canAutofill is false", () => {
      fixture.componentRef.setInput("isAutofillList", false);
      fixture.detectChanges();

      const titleKeyFn = component.cipherItemTitleKey();
      const result = titleKeyFn(mockCipher);

      expect(result).toBe("viewItemTitleWithField");
    });

    it("should return title without WithField when cipher has no username", () => {
      fixture.componentRef.setInput("isAutofillList", false);
      fixture.detectChanges();

      const cipherWithoutUsername = {
        ...mockCipher,
        login: { ...mockCipher.login, username: null },
      } as PopupCipherViewLike;

      const titleKeyFn = component.cipherItemTitleKey();
      const result = titleKeyFn(cipherWithoutUsername);

      expect(result).toBe("viewItemTitle");
    });
  });
});
