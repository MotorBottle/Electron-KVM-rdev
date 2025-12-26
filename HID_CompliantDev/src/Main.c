/*****************************************************************
 * File Name          : Main.c
 * Author             : MotorBottle & Jancgk(original) & Gemini Refactor
 *****************************************************************/

#include "CH58x_common.h"
#include "ws2812b.h"

// =======================================================================
//  CONFIG: USB PORT ASSIGNMENT
// =======================================================================
// 0: Normal Mode  -> USB1 is Controller, USB2 is Keyboard/Mouse (HID)
// 1: Swapped Mode -> USB1 is Keyboard/Mouse (HID), USB2 is Controller
#define USB_SWAP_MODE  0
// =======================================================================

#define DEBUG_PRT 0
#define DevEP0SIZE 0x40

/* -----------------------------------------------------------------------
   GLOBAL DATA BUFFERS
   ----------------------------------------------------------------------- */
// USB1 RAM
__attribute__((aligned(4))) uint8_t EP0_Databuf[64 + 64 + 64];
__attribute__((aligned(4))) uint8_t EP1_Databuf[64 + 64];
__attribute__((aligned(4))) uint8_t EP2_Databuf[64 + 64];
__attribute__((aligned(4))) uint8_t EP3_Databuf[64 + 64];

// USB2 RAM
__attribute__((aligned(4))) uint8_t U2EP0_Databuf[64 + 64 + 64];
__attribute__((aligned(4))) uint8_t U2EP1_Databuf[64 + 64];
__attribute__((aligned(4))) uint8_t U2EP2_Databuf[64 + 64];
__attribute__((aligned(4))) uint8_t U2EP3_Databuf[64 + 64];
__attribute__((aligned(4))) uint8_t U2EP4_Databuf[64 + 64]; 

/* -----------------------------------------------------------------------
   DESCRIPTORS
   ----------------------------------------------------------------------- */
const uint8_t MyDevDescr[] = {0x12, 0x01, 0x10, 0x01, 0x00, 0x00, 0x00, DevEP0SIZE, 
                              0x3d, 0x41, 0x07, 0x21, 0x00, 0x01, 0x01, 0x02, 0x00, 0x01};
const uint8_t MyCfgDescr[] = {
    0x09, 0x02, 0x29, 0x00, 0x01, 0x01, 0x04, 0xA0, 0x64,
    0x09, 0x04, 0x00, 0x00, 0x02, 0x03, 0x00, 0x00, 0x05,
    0x09, 0x21, 0x00, 0x01, 0x00, 0x01, 0x22, 0x22, 0x00,
    0x07, 0x05, 0x81, 0x03, 0x40, 0x00, 0x01,
    0x07, 0x05, 0x01, 0x03, 0x40, 0x00, 0x01
};
const uint8_t HIDDescr[] = {
    0x06, 0x00, 0xff, 0x09, 0x01, 0xa1, 0x01, 0x09, 0x02, 0x15, 0x00, 0x26, 0x00, 0xff,
    0x75, 0x08, 0x95, 0x0A, 0x81, 0x06, 0x09, 0x02, 0x15, 0x00, 0x26, 0x00, 0xff, 0x75, 
    0x08, 0x95, 0x0A, 0x91, 0x06, 0xC0
};

#define U2DevEP0SIZE 0x40
const uint8_t U2MyDevDescr[] = {0x12, 0x01, 0x10, 0x01, 0x00, 0x00, 0x00, U2DevEP0SIZE, 
                                0x3d, 0x41, 0x08, 0x21, 0x00, 0x01, 0x01, 0x02, 0x00, 0x01};

const uint8_t U2MyCfgDescr[] = {
    0x09, 0x02, 0x54, 0x00, 0x03, 0x01, 0x00, 0xE0, 0x19,
    0x09, 0x04, 0x00, 0x00, 0x01, 0x03, 0x01, 0x01, 0x00, // KBD
    0x09, 0x21, 0x11, 0x01, 0x00, 0x01, 0x22, 0x3e, 0x00,
    0x07, 0x05, 0x81, 0x03, 0x08, 0x00, 0x01,
    0x09, 0x04, 0x01, 0x00, 0x01, 0x03, 0x01, 0x02, 0x00, // Mouse Abs
    0x09, 0x21, 0x10, 0x01, 0x00, 0x01, 0x22, 0x48, 0x00, 
    0x07, 0x05, 0x82, 0x03, 0x06, 0x00, 0x0a,
    0x09, 0x04, 0x02, 0x00, 0x01, 0x03, 0x01, 0x02, 0x00, // Mouse Rel
    0x09, 0x21, 0x10, 0x01, 0x00, 0x01, 0x22, 0x46, 0x00, 
    0x07, 0x05, 0x83, 0x03, 0x04, 0x00, 0x0a
};

const uint8_t U2KeyRepDesc[] = {
    0x05, 0x01, 0x09, 0x06, 0xA1, 0x01, 0x05, 0x07, 0x19, 0xe0, 0x29, 0xe7, 0x15, 0x00, 
    0x25, 0x01, 0x75, 0x01, 0x95, 0x08, 0x81, 0x02, 0x95, 0x01, 0x75, 0x08, 0x81, 0x01, 
    0x95, 0x03, 0x75, 0x01, 0x05, 0x08, 0x19, 0x01, 0x29, 0x03, 0x91, 0x02, 0x95, 0x05, 
    0x75, 0x01, 0x91, 0x01, 0x95, 0x06, 0x75, 0x08, 0x26, 0xff, 0x00, 0x05, 0x07, 0x19, 
    0x00, 0x29, 0x91, 0x81, 0x00, 0xC0
};

const uint8_t U2MouseRepDesc[] = {
    0x05, 0x01, 0x09, 0x02, 0xA1, 0x01, 0x09, 0x01, 0xA1, 0x00, 0x05, 0x09, 0x19, 0x01, 
    0x29, 0x05, 0x15, 0x00, 0x25, 0x01, 0x95, 0x05, 0x75, 0x01, 0x81, 0x02, 0x75, 0x03, 
    0x95, 0x01, 0x81, 0x03, 0x05, 0x01, 0x09, 0x30, 0x09, 0x31, 0x15, 0x00, 0x26, 0xFF, 
    0x7F, 0x35, 0x00, 0x46, 0xff, 0x7f, 0x75, 0x10, 0x95, 0x02, 0x81, 0x02, 0x09, 0x38, 
    0x15, 0x81, 0x25, 0x7F, 0x35, 0x81, 0x45, 0x7f, 0x75, 0x08, 0x95, 0x01, 0x81, 0x06, 
    0xC0, 0xC0
};

const uint8_t U2MouseRelDesc[] = {
    0x05, 0x01, 0x09, 0x02, 0xA1, 0x01, 0x09, 0x01, 0xA1, 0x00, 0x05, 0x09, 0x19, 0x01, 
    0x29, 0x05, 0x15, 0x00, 0x25, 0x01, 0x95, 0x05, 0x75, 0x01, 0x81, 0x02, 0x75, 0x03, 
    0x95, 0x01, 0x81, 0x03, 0x05, 0x01, 0x09, 0x30, 0x09, 0x31, 0x15, 0x81, 0x25, 0x7F, 
    0x35, 0x81, 0x45, 0x7F, 0x75, 0x08, 0x95, 0x02, 0x81, 0x06, 0x09, 0x38, 0x15, 0x81, 
    0x25, 0x7F, 0x35, 0x81, 0x45, 0x7f, 0x75, 0x08, 0x95, 0x01, 0x81, 0x06, 0xC0, 0xC0
};

const uint8_t MyLangDescr[] = {0x04, 0x03, 0x09, 0x04};
const uint8_t MyManuInfo[] = {0x30, 0x03, 'M', 0, 'o', 0, 'y', 0, 'u', 0, ' ', 0, 'a', 0, 't', 0, ' ', 0, 'w', 0, 'o', 0, 'r', 0, 'k', 0, ' ', 0, 'T', 0, 'e', 0, 'c', 0, 'h', 0, 'n', 0, 'o', 0, 'l', 0, 'o', 0, 'g', 0, 'y', 0};
const uint8_t MyProdInfo[] = {0x1C, 0x03, 'K', 0, 'V', 0, 'M', 0, ' ', 0, 'C', 0, 'a', 0, 'r', 0, 'd', 0, ' ', 0, 'M', 0, 'i', 0, 'n', 0, 'i', 0};
const uint8_t U2MyProdInfo[] = {0x1E, 0x03, 'K', 0, 'V', 0, 'M', 0, ' ', 0, 'C', 0, 'o', 0, 'n', 0, 't', 0, 'r', 0, 'o', 0, 'l', 0, 'l', 0, 'e', 0, 'r', 0};

/* USB Speed Configs */
const uint8_t U2My_QueDescr[] = {0x0A, 0x06, 0x00, 0x02, 0xFF, 0x00, 0xFF, 0x40, 0x01, 0x00};
uint8_t U2USB_FS_OSC_DESC[sizeof(U2MyCfgDescr)] = {0x09, 0x07};

/* -----------------------------------------------------------------------
   VARIABLES & HELPERS
   ----------------------------------------------------------------------- */
uint8_t DevConfig, Ready = 0;
uint8_t SetupReqCode;
uint16_t SetupReqLen;
const uint8_t *pDescr;
uint8_t Report_Value = 0x00;
uint8_t Idle_Value = 0x00;
uint8_t USB_SleepStatus = 0x00;

uint8_t HID_Buf[10] = {0x0};
uint8_t HIDOutData[10] = {0x0};
uint8_t HIDKeyLightsCode = 0;

uint8_t U2DevConfig, U2Ready;
uint8_t U2SetupReqCode;
uint16_t U2SetupReqLen;
const uint8_t *pU2Descr;
uint8_t U2Report_Value = 0x00;
uint8_t U2Idle_Value = 0x00;
uint8_t U2USB_SleepStatus = 0x00;

uint8_t U2HIDMouseRel[6] = {0x0};
uint8_t U2HIDMouse[6] = {0x0};
uint8_t U2HIDKey[8] = {0x0};

uint8_t __IO mode = 0;
const uint8_t empty_buf[8] = {0x00};
const uint8_t rgb_ready[3] = {0x00, 0x05, 0x00};

void DevEP1_OUT_Deal(uint8_t l);
void U2DevEP1_OUT_Deal(uint8_t l);
void DevEP1_IN_Deal(uint8_t l);
void U2DevEP1_IN_Deal(uint8_t l);

/* =======================================================================
   ROUTING HELPERS - DIRECT HARDWARE WRITE
   ======================================================================= */
void Send_Key_Report(uint8_t *data) {
#if (USB_SWAP_MODE == 0)
    memcpy(pU2EP1_IN_DataBuf, data, 8);
    U2DevEP1_IN_Deal(8);
#else
    memcpy(pEP1_IN_DataBuf, data, 8);
    DevEP1_IN_Deal(8);
#endif
}

void Send_Mouse_Report(uint8_t *data) {
#if (USB_SWAP_MODE == 0)
    // Mode 0: USB2 (Use Library Defaults)
    memcpy(pU2EP2_IN_DataBuf, data, 6);
    U2DevEP2_IN_Deal(6);
#else
    // Mode 1: USB1 (Manual Write)
    // Write directly to EP2_Databuf at offset 64 (The IN Buffer)
    memcpy(EP2_Databuf + 64, data, 6);
    
    // Set Length and Arm the endpoint (ACK)
    R8_UEP2_T_LEN = 6;
    R8_UEP2_CTRL = (R8_UEP2_CTRL & ~MASK_UEP_T_RES) | UEP_T_RES_ACK;
#endif
}

void Send_MouseRel_Report(uint8_t *data) {
#if (USB_SWAP_MODE == 0)
    memcpy(pU2EP3_IN_DataBuf, data, 4);
    U2DevEP3_IN_Deal(4);
#else
    // Mode 1: USB1 (Manual Write)
    memcpy(EP3_Databuf + 64, data, 4);
    
    R8_UEP3_T_LEN = 4;
    R8_UEP3_CTRL = (R8_UEP3_CTRL & ~MASK_UEP_T_RES) | UEP_T_RES_ACK;
#endif
}

void Send_Control_Data(uint8_t *data) {
#if (USB_SWAP_MODE == 0)
    memcpy(pEP1_IN_DataBuf, data, 10);
    DevEP1_IN_Deal(10);
#else
    memcpy(pU2EP1_IN_DataBuf, data, 10);
    U2DevEP1_IN_Deal(10);
#endif
}

/* =======================================================================
   USB1 INTERRUPTS
   ======================================================================= */
void USB_DevTransProcess(void) 
{
    uint8_t len, chtype;
    uint8_t intflag, errflag = 0;

    intflag = R8_USB_INT_FG;

    if (intflag & RB_UIF_TRANSFER) {
        if ((R8_USB_INT_ST & MASK_UIS_TOKEN) != MASK_UIS_TOKEN) {
            switch (R8_USB_INT_ST & (MASK_UIS_TOKEN | MASK_UIS_ENDP)) {
                
                case UIS_TOKEN_IN: 
                    switch (SetupReqCode) {
                        case USB_GET_DESCRIPTOR:
                            len = SetupReqLen >= DevEP0SIZE ? DevEP0SIZE : SetupReqLen;
                            memcpy(pEP0_DataBuf, pDescr, len);
                            SetupReqLen -= len;
                            pDescr += len;
                            R8_UEP0_T_LEN = len;
                            R8_UEP0_CTRL ^= RB_UEP_T_TOG;
                            break;
                        case USB_SET_ADDRESS:
                            R8_USB_DEV_AD = (R8_USB_DEV_AD & RB_UDA_GP_BIT) | SetupReqLen;
                            R8_UEP0_CTRL = UEP_R_RES_ACK | UEP_T_RES_NAK;
                            break;
                        default:
                            R8_UEP0_T_LEN = 0;
                            R8_UEP0_CTRL = UEP_R_RES_ACK | UEP_T_RES_NAK;
                            Ready = 1;
                            break;
                    }
                    break;

                case UIS_TOKEN_OUT:
                    len = R8_USB_RX_LEN;
#if (USB_SWAP_MODE == 1)
                    if (SetupReqCode == 0x09 && len > 0) HIDKeyLightsCode = pEP0_DataBuf[0];
#endif
                    break;

                case UIS_TOKEN_OUT | 1:
                    if (R8_USB_INT_ST & RB_UIS_TOG_OK) {
                        R8_UEP1_CTRL ^= RB_UEP_R_TOG;
                        len = R8_USB_RX_LEN;
                        DevEP1_OUT_Deal(len);
                    }
                    break;

                case UIS_TOKEN_IN | 1:
                    R8_UEP1_CTRL ^= RB_UEP_T_TOG;
                    R8_UEP1_CTRL = (R8_UEP1_CTRL & ~MASK_UEP_T_RES) | UEP_T_RES_NAK;
                    Ready = 1;
                    break;
                
                // --- USB1 HID ENDPOINTS ---
                case UIS_TOKEN_IN | 2: // Mouse Abs
                    R8_UEP2_CTRL ^= RB_UEP_T_TOG;
                    R8_UEP2_CTRL = (R8_UEP2_CTRL & ~MASK_UEP_T_RES) | UEP_T_RES_NAK;
                    break;
                case UIS_TOKEN_IN | 3: // Mouse Rel
                    R8_UEP3_CTRL ^= RB_UEP_T_TOG;
                    R8_UEP3_CTRL = (R8_UEP3_CTRL & ~MASK_UEP_T_RES) | UEP_T_RES_NAK;
                    break;
            }
            R8_USB_INT_FG = RB_UIF_TRANSFER;
        }

        if (R8_USB_INT_ST & RB_UIS_SETUP_ACT) {
            R8_UEP0_CTRL = RB_UEP_R_TOG | RB_UEP_T_TOG | UEP_R_RES_ACK | UEP_T_RES_NAK;
            SetupReqLen = pSetupReqPak->wLength;
            SetupReqCode = pSetupReqPak->bRequest;
            chtype = pSetupReqPak->bRequestType;

            len = 0; errflag = 0;
            if ((pSetupReqPak->bRequestType & USB_REQ_TYP_MASK) != USB_REQ_TYP_STANDARD) {
                if (pSetupReqPak->bRequestType & 0x20) {
                    switch (SetupReqCode) {
                        case DEF_USB_SET_IDLE: Idle_Value = EP0_Databuf[3]; break;
                        case DEF_USB_SET_REPORT: break;
                        case DEF_USB_SET_PROTOCOL: Report_Value = EP0_Databuf[2]; break;
                        case DEF_USB_GET_IDLE: EP0_Databuf[0] = Idle_Value; len = 1; break;
                        case DEF_USB_GET_PROTOCOL: EP0_Databuf[0] = Report_Value; len = 1; break;
                        default: errflag = 0xFF;
                    }
                }
            } else {
                switch (SetupReqCode) {
                    case USB_GET_DESCRIPTOR:
                        switch (((pSetupReqPak->wValue) >> 8)) {
                            case USB_DESCR_TYP_DEVICE:
#if (USB_SWAP_MODE == 0)
                                pDescr = MyDevDescr; len = MyDevDescr[0];
#else
                                pDescr = U2MyDevDescr; len = U2MyDevDescr[0];
#endif
                                break;
                            case USB_DESCR_TYP_CONFIG:
#if (USB_SWAP_MODE == 0)
                                pDescr = MyCfgDescr; len = MyCfgDescr[2];
#else
                                pDescr = U2MyCfgDescr; len = U2MyCfgDescr[2];
#endif
                                break;
                            case USB_DESCR_TYP_HID:
#if (USB_SWAP_MODE == 0)
                                pDescr = (uint8_t *)(&MyCfgDescr[18]); len = 9;
#else
                                if (((pSetupReqPak->wIndex) & 0xff) == 0) { pDescr = (uint8_t *)(&U2MyCfgDescr[18]); len = 9; }
                                else if (((pSetupReqPak->wIndex) & 0xff) == 1) { pDescr = (uint8_t *)(&U2MyCfgDescr[43]); len = 9; }
                                else if (((pSetupReqPak->wIndex) & 0xff) == 2) { pDescr = (uint8_t *)(&U2MyCfgDescr[68]); len = 9; }
                                else { errflag = 0xFF; }
#endif
                                break;
                            case USB_DESCR_TYP_REPORT:
#if (USB_SWAP_MODE == 0)
                                if (((pSetupReqPak->wIndex) & 0xff) == 0) { pDescr = HIDDescr; len = sizeof(HIDDescr); }
#else
                                if (((pSetupReqPak->wIndex) & 0xff) == 0) { pDescr = U2KeyRepDesc; len = sizeof(U2KeyRepDesc); }
                                else if (((pSetupReqPak->wIndex) & 0xff) == 1) { pDescr = U2MouseRepDesc; len = sizeof(U2MouseRepDesc); }
                                else if (((pSetupReqPak->wIndex) & 0xff) == 2) { pDescr = U2MouseRelDesc; len = sizeof(U2MouseRelDesc); }
#endif
                                break;
                            case USB_DESCR_TYP_STRING:
                                switch ((pSetupReqPak->wValue) & 0xff) {
                                    case 1: pDescr = MyManuInfo; len = MyManuInfo[0]; break;
                                    case 2: 
#if (USB_SWAP_MODE == 0)
                                        pDescr = MyProdInfo; len = MyProdInfo[0]; 
#else
                                        pDescr = U2MyProdInfo; len = U2MyProdInfo[0];
#endif
                                        break;
                                    case 0: pDescr = MyLangDescr; len = MyLangDescr[0]; break;
                                    default: errflag = 0xFF; break;
                                }
                                break;
                            default: errflag = 0xff; break;
                        }
                        if (SetupReqLen > len) SetupReqLen = len;
                        len = (SetupReqLen >= DevEP0SIZE) ? DevEP0SIZE : SetupReqLen;
                        memcpy(pEP0_DataBuf, pDescr, len);
                        pDescr += len;
                        break;
                    case USB_SET_ADDRESS: SetupReqLen = (pSetupReqPak->wValue) & 0xff; break;
                    case USB_GET_CONFIGURATION: pEP0_DataBuf[0] = DevConfig; if (SetupReqLen > 1) SetupReqLen = 1; break;
                    case USB_SET_CONFIGURATION: DevConfig = (pSetupReqPak->wValue) & 0xff; break;
                    default: errflag = 0xff; break;
                }
            }
            if (errflag == 0xff) {
                R8_UEP0_CTRL = RB_UEP_R_TOG | RB_UEP_T_TOG | UEP_R_RES_STALL | UEP_T_RES_STALL;
            } else {
                if (chtype & 0x80) { len = (SetupReqLen > DevEP0SIZE) ? DevEP0SIZE : SetupReqLen; SetupReqLen -= len; } else len = 0;
                R8_UEP0_T_LEN = len;
                R8_UEP0_CTRL = RB_UEP_R_TOG | RB_UEP_T_TOG | UEP_R_RES_ACK | UEP_T_RES_ACK;
            }
            R8_USB_INT_FG = RB_UIF_TRANSFER;
        }
    }
    else if (intflag & RB_UIF_BUS_RST) {
        R8_USB_DEV_AD = 0;
        R8_UEP0_CTRL = UEP_R_RES_ACK | UEP_T_RES_NAK;
        R8_UEP1_CTRL = UEP_R_RES_ACK | UEP_T_RES_NAK;
        R8_UEP2_CTRL = UEP_R_RES_ACK | UEP_T_RES_NAK;
        R8_UEP3_CTRL = UEP_R_RES_ACK | UEP_T_RES_NAK;
        R8_USB_INT_FG = RB_UIF_BUS_RST;
    }
    else if (intflag & RB_UIF_SUSPEND) R8_USB_INT_FG = RB_UIF_SUSPEND;
    else R8_USB_INT_FG = intflag;
}

/* =======================================================================
   USB2 INTERRUPTS
   ======================================================================= */
void USB2_DevTransProcess(void) {
    uint8_t len, chtype;
    uint8_t intflag, errflag = 0;

    intflag = R8_USB2_INT_FG;
    if (intflag & RB_UIF_TRANSFER) {
        if ((R8_USB2_INT_ST & MASK_UIS_TOKEN) != MASK_UIS_TOKEN) {
            switch (R8_USB2_INT_ST & (MASK_UIS_TOKEN | MASK_UIS_ENDP)) {
                
                case UIS_TOKEN_IN: {
                    switch (U2SetupReqCode) {
                        case USB_GET_DESCRIPTOR:
                            len = U2SetupReqLen >= U2DevEP0SIZE ? U2DevEP0SIZE : U2SetupReqLen;
                            memcpy(pU2EP0_DataBuf, pU2Descr, len);
                            U2SetupReqLen -= len;
                            pU2Descr += len;
                            R8_U2EP0_T_LEN = len;
                            R8_U2EP0_CTRL ^= RB_UEP_T_TOG;
                            break;
                        case USB_SET_ADDRESS:
                            R8_USB2_DEV_AD = (R8_USB2_DEV_AD & RB_UDA_GP_BIT) | U2SetupReqLen;
                            R8_U2EP0_CTRL = UEP_R_RES_ACK | UEP_T_RES_NAK;
                            break;
                        default:
                            R8_U2EP0_T_LEN = 0;
                            R8_U2EP0_CTRL = UEP_R_RES_ACK | UEP_T_RES_NAK;
                            break;
                    }
                } break;

                case UIS_TOKEN_OUT: {
                    len = R8_USB2_RX_LEN;
#if (USB_SWAP_MODE == 0)
                    if (U2SetupReqCode == 0x09) HIDKeyLightsCode = pU2EP0_DataBuf[0];
#endif
                } break;

                case UIS_TOKEN_OUT | 1: {
                    if (R8_USB2_INT_ST & RB_UIS_TOG_OK) {
                        R8_U2EP1_CTRL ^= RB_UEP_R_TOG;
                        len = R8_USB2_RX_LEN;
                        U2DevEP1_OUT_Deal(len);
                    }
                } break;

                case UIS_TOKEN_IN | 1:
                    R8_U2EP1_CTRL ^= RB_UEP_T_TOG;
                    R8_U2EP1_CTRL = (R8_U2EP1_CTRL & ~MASK_UEP_T_RES) | UEP_T_RES_NAK;
                    U2EP1_BUSY = 0;
                    break;

                // --- USB2 HID ENDPOINTS ---
                case UIS_TOKEN_OUT | 2:
                     if (R8_USB2_INT_ST & RB_UIS_TOG_OK) {
                        R8_U2EP2_CTRL ^= RB_UEP_R_TOG;
                        len = R8_USB2_RX_LEN;
                     }
                     break;
                case UIS_TOKEN_IN | 2:
                    R8_U2EP2_CTRL ^= RB_UEP_T_TOG;
                    R8_U2EP2_CTRL = (R8_U2EP2_CTRL & ~MASK_UEP_T_RES) | UEP_T_RES_NAK;
                    U2EP2_BUSY = 0;
                    break;
                case UIS_TOKEN_OUT | 3:
                     if (R8_USB2_INT_ST & RB_UIS_TOG_OK) {
                        R8_U2EP3_CTRL ^= RB_UEP_R_TOG;
                        len = R8_USB2_RX_LEN;
                     }
                     break;
                case UIS_TOKEN_IN | 3:
                    R8_U2EP3_CTRL ^= RB_UEP_T_TOG;
                    R8_U2EP3_CTRL = (R8_U2EP3_CTRL & ~MASK_UEP_T_RES) | UEP_T_RES_NAK;
                    break;
            }
            R8_USB2_INT_FG = RB_UIF_TRANSFER;
        }

        if (R8_USB2_INT_ST & RB_UIS_SETUP_ACT) {
            R8_U2EP0_CTRL = RB_UEP_R_TOG | RB_UEP_T_TOG | UEP_R_RES_ACK | UEP_T_RES_NAK;
            U2SetupReqLen = pU2SetupReqPak->wLength;
            U2SetupReqCode = pU2SetupReqPak->bRequest;
            chtype = pU2SetupReqPak->bRequestType;

            len = 0; errflag = 0;
            if ((pU2SetupReqPak->bRequestType & USB_REQ_TYP_MASK) != USB_REQ_TYP_STANDARD) {
                 if (pU2SetupReqPak->bRequestType & 0x20) {
                     switch (U2SetupReqCode) {
                        case DEF_USB_SET_IDLE: U2Idle_Value = EP0_Databuf[3]; break;
                        case DEF_USB_SET_REPORT: break;
                        case DEF_USB_SET_PROTOCOL: U2Report_Value = U2EP0_Databuf[2]; break;
                        case DEF_USB_GET_IDLE: U2EP0_Databuf[0] = U2Idle_Value; len = 1; break;
                        case DEF_USB_GET_PROTOCOL: U2EP0_Databuf[0] = U2Report_Value; len = 1; break;
                        default: errflag = 0xFF;
                     }
                 }
            } else {
                switch (U2SetupReqCode) {
                    case USB_GET_DESCRIPTOR:
                        switch (((pU2SetupReqPak->wValue) >> 8)) {
                            case USB_DESCR_TYP_DEVICE:
#if (USB_SWAP_MODE == 0)
                                pU2Descr = U2MyDevDescr; len = U2MyDevDescr[0];
#else
                                pU2Descr = MyDevDescr; len = MyDevDescr[0];
#endif
                                break;
                            case USB_DESCR_TYP_CONFIG:
#if (USB_SWAP_MODE == 0)
                                pU2Descr = U2MyCfgDescr; len = U2MyCfgDescr[2];
#else
                                pU2Descr = MyCfgDescr; len = MyCfgDescr[2];
#endif
                                break;
                            case USB_DESCR_TYP_HID:
#if (USB_SWAP_MODE == 0)
                                if (((pU2SetupReqPak->wIndex) & 0xff) == 0) { pU2Descr = (uint8_t *)(&U2MyCfgDescr[18]); len = 9; }
                                else if (((pU2SetupReqPak->wIndex) & 0xff) == 1) { pU2Descr = (uint8_t *)(&U2MyCfgDescr[43]); len = 9; }
                                else if (((pU2SetupReqPak->wIndex) & 0xff) == 2) { pU2Descr = (uint8_t *)(&U2MyCfgDescr[68]); len = 9; }
                                else { errflag = 0xFF; }
#else
                                pU2Descr = (uint8_t *)(&MyCfgDescr[18]); len = 9;
#endif
                                break;
                            case USB_DESCR_TYP_REPORT:
#if (USB_SWAP_MODE == 0)
                                if (((pU2SetupReqPak->wIndex) & 0xff) == 0) { pU2Descr = U2KeyRepDesc; len = sizeof(U2KeyRepDesc); }
                                else if (((pU2SetupReqPak->wIndex) & 0xff) == 1) { pU2Descr = U2MouseRepDesc; len = sizeof(U2MouseRepDesc); }
                                else if (((pU2SetupReqPak->wIndex) & 0xff) == 2) { pU2Descr = U2MouseRelDesc; len = sizeof(U2MouseRelDesc); U2Ready = 1; }
#else
                                if (((pU2SetupReqPak->wIndex) & 0xff) == 0) { pU2Descr = HIDDescr; len = sizeof(HIDDescr); }
#endif
                                break;
                            case USB_DESCR_TYP_STRING:
                                switch ((pU2SetupReqPak->wValue) & 0xff) {
                                    case 1: pU2Descr = MyManuInfo; len = MyManuInfo[0]; break;
                                    case 2: 
#if (USB_SWAP_MODE == 0)
                                        pU2Descr = U2MyProdInfo; len = U2MyProdInfo[0];
#else
                                        pU2Descr = MyProdInfo; len = MyProdInfo[0]; 
#endif
                                        break;
                                    case 0: pU2Descr = MyLangDescr; len = MyLangDescr[0]; break;
                                    default: errflag = 0xFF; break;
                                }
                                break;
                            default: errflag = 0xff; break;
                        }
                        if (U2SetupReqLen > len) U2SetupReqLen = len;
                        len = (U2SetupReqLen >= U2DevEP0SIZE) ? U2DevEP0SIZE : U2SetupReqLen;
                        memcpy(pU2EP0_DataBuf, pU2Descr, len);
                        pU2Descr += len;
                        break;
                    
                    case USB_SET_ADDRESS: U2SetupReqLen = (pU2SetupReqPak->wValue) & 0xff; break;
                    case USB_GET_CONFIGURATION: pU2EP0_DataBuf[0] = U2DevConfig; if (U2SetupReqLen > 1) U2SetupReqLen = 1; break;
                    case USB_SET_CONFIGURATION: U2DevConfig = (pU2SetupReqPak->wValue) & 0xff; break;
                    default: errflag = 0xff; break;
                }
            }
            if (errflag == 0xff) {
                R8_U2EP0_CTRL = RB_UEP_R_TOG | RB_UEP_T_TOG | UEP_R_RES_STALL | UEP_T_RES_STALL;
            } else {
                if (chtype & 0x80) { len = (U2SetupReqLen > U2DevEP0SIZE) ? U2DevEP0SIZE : U2SetupReqLen; U2SetupReqLen -= len; } else len = 0;
                R8_U2EP0_T_LEN = len;
                R8_U2EP0_CTRL = RB_UEP_R_TOG | RB_UEP_T_TOG | UEP_R_RES_ACK | UEP_T_RES_ACK;
            }
            R8_USB2_INT_FG = RB_UIF_TRANSFER;
        }
    }
    else if (intflag & RB_UIF_BUS_RST) {
        R8_USB2_DEV_AD = 0;
        R8_U2EP0_CTRL = UEP_R_RES_ACK | UEP_T_RES_NAK;
        R8_U2EP1_CTRL = UEP_R_RES_ACK | UEP_T_RES_NAK;
        R8_U2EP2_CTRL = UEP_R_RES_ACK | UEP_T_RES_NAK;
        R8_U2EP3_CTRL = UEP_R_RES_ACK | UEP_T_RES_NAK;
        R8_USB2_INT_FG = RB_UIF_BUS_RST;
    }
    else if (intflag & RB_UIF_SUSPEND) R8_USB2_INT_FG = RB_UIF_SUSPEND;
    else R8_USB2_INT_FG = intflag;
}

// OUT Handler USB1
void DevEP1_OUT_Deal(uint8_t l) {
#if (USB_SWAP_MODE == 1)
    // Mode 1: USB1 is HID. Do not process control commands here.
#else
    // Mode 0: USB1 is Controller
    switch (pEP1_OUT_DataBuf[0]) {
        case 1: Send_Key_Report(pEP1_OUT_DataBuf + 2); break;
        case 2: Send_Mouse_Report(pEP1_OUT_DataBuf + 2); break;
        case 3:
            HID_Buf[0] = 3; HID_Buf[2] = HIDKeyLightsCode;
            Send_Control_Data(HID_Buf);
            break;
        case 4: SYS_ResetExecute(); break;
        case 5: SendOnePix(pEP1_OUT_DataBuf + 2); break;
        case 6: Send_Key_Report(pEP1_OUT_DataBuf + 2); mode = 1; break;
        case 7: Send_MouseRel_Report(pEP1_OUT_DataBuf + 2); break;
        case 0x6F:
             if (pEP1_OUT_DataBuf[2] == 0) { GPIOB_ResetBits(GPIO_Pin_4); GPIOB_SetBits(GPIO_Pin_7); GPIOA_SetBits(GPIO_Pin_12); }
             else if (pEP1_OUT_DataBuf[2] == 1) { GPIOB_SetBits(GPIO_Pin_4); GPIOB_ResetBits(GPIO_Pin_7); GPIOA_ResetBits(GPIO_Pin_12); }
             else if (pEP1_OUT_DataBuf[2] == 2) { GPIOB_SetBits(GPIO_Pin_4); GPIOB_SetBits(GPIO_Pin_7); GPIOA_ResetBits(GPIO_Pin_12); }
             else if (pEP1_OUT_DataBuf[2] == 3) {
                 HID_Buf[0] = 0x6F; HID_Buf[2] = 3;
                 HID_Buf[3] = GPIOB_ReadPortPin(GPIO_Pin_4) ? 1 : 0;
                 HID_Buf[4] = GPIOB_ReadPortPin(GPIO_Pin_7) ? 1 : 0;
                 HID_Buf[5] = GPIOA_ReadPortPin(GPIO_Pin_12) ? 1 : 0;
                 Send_Control_Data(HID_Buf);
             }
             break;
    }
#endif
}

// OUT Handler USB2
void U2DevEP1_OUT_Deal(uint8_t l) {
#if (USB_SWAP_MODE == 1)
    // Mode 1: USB2 is Controller
    switch (pU2EP1_OUT_DataBuf[0]) {
        case 1: Send_Key_Report(pU2EP1_OUT_DataBuf + 2); break;
        case 2: Send_Mouse_Report(pU2EP1_OUT_DataBuf + 2); break;
        case 3:
            HID_Buf[0] = 3; HID_Buf[2] = HIDKeyLightsCode;
            Send_Control_Data(HID_Buf);
            break;
        case 7: Send_MouseRel_Report(pU2EP1_OUT_DataBuf + 2); break;
    }
#else
    // Mode 0: USB2 is HID. Default Echo/Invert logic
    uint8_t i;
    for (i = 0; i < l; i++) { pU2EP1_IN_DataBuf[i] = ~pU2EP1_OUT_DataBuf[i]; }
    U2DevEP1_IN_Deal(l);
#endif
}

void DevWakeup(void) {
    R16_PIN_ANALOG_IE &= ~(RB_PIN_USB_DP_PU);
    R8_UDEV_CTRL |= RB_UD_LOW_SPEED;
    mDelaymS(2);
    R8_UDEV_CTRL &= ~RB_UD_LOW_SPEED;
    R16_PIN_ANALOG_IE |= RB_PIN_USB_DP_PU;
}

void U2DevWakeup(void) {
    R16_PIN_ANALOG_IE &= ~(RB_PIN_USB2_DP_PU);
    R8_U2DEV_CTRL |= RB_UD_LOW_SPEED;
    mDelaymS(2);
    R8_U2DEV_CTRL &= ~RB_UD_LOW_SPEED;
    R16_PIN_ANALOG_IE |= RB_PIN_USB2_DP_PU;
}

void DebugInit(void) {
    GPIOA_SetBits(GPIO_Pin_9);
    GPIOA_ModeCfg(GPIO_Pin_8, GPIO_ModeIN_PU);
    GPIOA_ModeCfg(GPIO_Pin_9, GPIO_ModeOut_PP_5mA);
    UART1_DefInit();
}

__attribute__((interrupt("WCH-Interrupt-fast")))
__attribute__((section(".highcode"))) void USB_IRQHandler(void) {
    USB_DevTransProcess();
}

__INTERRUPT
__HIGH_CODE
void USB2_IRQHandler(void) {
    USB2_DevTransProcess();
}

/* =======================================================================
   MAIN - WITH TOGGLE BIT RESET
   ======================================================================= */
int main() {
    SetSysClock(CLK_SOURCE_PLL_60MHz);
    DebugInit();

    // 1. Assign RAM pointers
    pEP0_RAM_Addr = EP0_Databuf;
    pEP1_RAM_Addr = EP1_Databuf;
    pEP2_RAM_Addr = EP2_Databuf;
    pEP3_RAM_Addr = EP3_Databuf;

    pU2EP0_RAM_Addr = U2EP0_Databuf;
    pU2EP1_RAM_Addr = U2EP1_Databuf;
    pU2EP2_RAM_Addr = U2EP2_Databuf;
    pU2EP3_RAM_Addr = U2EP3_Databuf;

    // 2. Initialize USB Hardware
    USB_DeviceInit();
    USB2_DeviceInit();

    // 3. Conditional Configuration
#if (USB_SWAP_MODE == 0)
    // -------------------------------------------------------------------
    // MODE 0: ORIGINAL SETUP (USB1=Ctrl, USB2=HID)
    // -------------------------------------------------------------------
    // Use library defaults for USB2.
    // Ensure USB1 (Controller) EP1 is ready for RX.
    R8_UEP4_1_MOD |= RB_UEP1_RX_EN; 
    R8_UEP1_CTRL  = UEP_T_RES_NAK | UEP_R_RES_ACK; 
    
#else
    // -------------------------------------------------------------------
    // MODE 1: SWAPPED SETUP (USB1=HID, USB2=Ctrl)
    // -------------------------------------------------------------------
    
    // A. Manually register DMA addresses for USB1
    R16_UEP2_DMA = (uint16_t)(uint32_t)EP2_Databuf;
    R16_UEP3_DMA = (uint16_t)(uint32_t)EP3_Databuf;

    // B. Enable Transmit (TX) for EP2 and EP3
    R8_UEP2_3_MOD |= RB_UEP2_TX_EN | RB_UEP3_TX_EN;
    
    // C. RESET TOGGLE BITS & SET NAK (CRITICAL FIX)
    // We explicitly clear the T_TOG bit to ensure the first packet is DATA0.
    // If this is random, the Host will reject the mouse packets.
    
    R8_UEP2_T_LEN = 0;
    R8_UEP2_CTRL = UEP_T_RES_NAK | UEP_R_RES_ACK; 
    R8_UEP2_CTRL &= ~RB_UEP_T_TOG; // Force DATA0 expectation

    R8_UEP3_T_LEN = 0;
    R8_UEP3_CTRL = UEP_T_RES_NAK | UEP_R_RES_ACK;
    R8_UEP3_CTRL &= ~RB_UEP_T_TOG; // Force DATA0 expectation

    // D. USB2 Config (Controller)
    // Just ensure EP1 is ready for commands
    R8_U2EP4_1_MOD |= RB_UEP1_RX_EN;
    R8_U2EP1_CTRL  = UEP_T_RES_NAK | UEP_R_RES_ACK;
#endif

    PFIC_EnableIRQ(USB_IRQn);
    PFIC_EnableIRQ(USB2_IRQn);

    /* GPIO Config */
    GPIOA_ModeCfg(GPIO_Pin_13, GPIO_ModeOut_PP_20mA); 
    SendOnePix((char *)rgb_ready);
    mDelaymS(100);

    /* KVM Switch GPIO */
    GPIOB_ReadPortPin(GPIO_Pin_4) ? 1 : 0;
    GPIOB_ModeCfg(GPIO_Pin_4, GPIO_ModeOut_PP_20mA); 
    GPIOB_ModeCfg(GPIO_Pin_7, GPIO_ModeOut_PP_5mA);  
    GPIOA_ModeCfg(GPIO_Pin_12, GPIO_ModeOut_PP_5mA); 

    GPIOB_SetBits(GPIO_Pin_4);
    GPIOB_ResetBits(GPIO_Pin_7);
    GPIOA_ResetBits(GPIO_Pin_12);

    while (1) {
        if (mode != 0) {
            switch (mode) {
                case 1:
                    Send_Key_Report((uint8_t*)empty_buf);
                    mode = 0;
                    break;
                default:
                    mode = 0;
                    break;
            }
        }
    }
}
