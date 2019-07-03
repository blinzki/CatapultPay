/*
 * MIT License
 *
 * Copyright (c) 2017 David Garcia <dgarcia360@outlook.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import {FormControl, FormGroup} from '@angular/forms';
import {Component} from '@angular/core';
import {AlertController, LoadingController, NavController, NavParams} from 'ionic-angular';
import {Keyboard} from '@ionic-native/keyboard';
import {TranslateService} from '@ngx-translate/core';
import {BarcodeScanner} from '@ionic-native/barcode-scanner';
import {AlertProvider} from '../../providers/alert/alert.provider';
import {ToastProvider} from '../../providers/toast/toast.provider';
import {WalletProvider} from '../../providers/wallet/wallet.provider';
import {BalancePage} from '../balance/balance';
import {LoginPage} from '../login/login';
import { SimpleWallet} from 'nem-library';
declare var require: any
const nem2Sdk = require("nem2-sdk");
const request = require('request')

const   Address = nem2Sdk.Address,
        Deadline = nem2Sdk.Deadline,
        Account = nem2Sdk.Account,
        UInt64 = nem2Sdk.UInt64,
        NetworkType = nem2Sdk.NetworkType,
        PlainMessage = nem2Sdk.PlainMessage,
        TransferTransaction = nem2Sdk.TransferTransaction,
        Mosaic = nem2Sdk.Mosaic,
        MosaicId = nem2Sdk.MosaicId;

const privateKey        = '0C17C706924F3E9F9F4D14291C1C10A92AB45D1E2039553CAA9E45EFEFE9833E';
var recipientAddress    = 'SCATYZRKPPJRQQ6NHEUXROFUMFLOY4RQOPGSKP6Z'; //Destino
var msg                 = 'Hello world';        // Mensaje
var amount              =  1500000;              // Monto x 1E6-> 1.5
const mosaicCode        = '0dc67fbe1cad29e3';   // Codigo de mosaico
const networkType       =  NetworkType.MIJIN_TEST;
const generationHash    = '57F7DA205008026C776CB6AED843393F04CD458E0AA2D9F1D5F31A402072B2D6';
const uri               = 'http://192.168.10.117:3000/transaction';

function createTX(recipientAddress, mosaicCode, msg, nT, amount){
    const transferTransaction = TransferTransaction.create(
        Deadline.create(),
        Address.createFromRawAddress(recipientAddress),
        [new Mosaic(new MosaicId(mosaicCode), UInt64.fromUint(amount))],
        PlainMessage.create(msg),
        nT,
    );
    return transferTransaction;
}

// Funcion que firma la transaccion
function singTX(tranTx, gH, pK, nT){
    const account = Account.createFromPrivateKey(pK, nT);
    const signedTransaction = account.sign(tranTx, gH);
    return signedTransaction;
}

function announceTX (signedTransaction){
    const payload = signedTransaction.payload
    const response = 'Sent';
    request({
        method: 'PUT',
        uri: uri,
        json: {
            payload: payload
        }
    }, function(error, response, body) {
        response = body;
    });
    return response;
}

@Component({
    selector: 'page-transfer',
    templateUrl: 'transfer.html'
})
export class TransferPage {
    private transferTransactionForm: FormGroup;
    private selectedWallet: SimpleWallet;
    constructor(public navCtrl: NavController, private navParams: NavParams,
                private wallet: WalletProvider, private alert: AlertProvider, private toast: ToastProvider,
                private barcodeScanner: BarcodeScanner, private alertCtrl: AlertController,
                private loading: LoadingController, private keyboard: Keyboard, public translate: TranslateService) {

        this.transferTransactionForm = new FormGroup ({
            amount: new FormControl(0, null),
            rawRecipient: new FormControl(navParams.get('address') || '', null),
            message: new FormControl('')
        });
    }

    ionViewWillEnter() {
        this.selectedWallet = this.wallet.getSelectedWallet();
        if (!this.selectedWallet) {
            this.navCtrl.setRoot(LoginPage);
        }
    }

    /**
     * Scans QR
     */
    // public scanQR() {
    //     this.barcodeScanner.scan().then((barcodeData) => {
    //         const addressObject = JSON.parse(barcodeData.text);
    //         this.transferTransactionForm.patchValue({rawRecipient: addressObject.data.addr});
    //         const amount =  addressObject.data.amount / Math.pow(10, this.selectedMosaic.properties.divisibility);
    //         this.transferTransactionForm.patchValue({amount: amount });
    //         this.transferTransactionForm.patchValue({message: addressObject.data.msg});
    //     }, (err) => {
    //         console.log("Error on scan");
    //     });
    // }

    /**
     * Prepares the TransferTransaction
     */
    public prepareTransaction() {
        this.presentPrompt();
    }

    /**
     * Builds confirmation subtitle
     */
    private subtitleBuilder(translate:string[]) {

        let subtitle = translate['YOU_ARE_GOING_TO_SEND'] + ' <br/><br/> ';
        const formValue = this.transferTransactionForm.value;
        recipientAddress = formValue.rawRecipient;
        amount = formValue.amount * 1000000;
        msg = formValue.message;
        subtitle +=  "<b>" + translate['AMOUNT'] + ":</b> ";
        subtitle += formValue.amount + " xem";
        subtitle += "<br/><br/>";
        return Promise.resolve(subtitle);
    }

    /**
     * Presents prompt to confirm the transaction
     */
    private presentPrompt() {
        this.translate
            .get(['YOU_ARE_GOING_TO_SEND', 'AMOUNT', 'FEE', 'LEVY', 'CONFIRM_TRANSACTION', 'PASSWORD', 'CANCEL',
                'CONFIRM', 'PLEASE_WAIT'], {})
            .subscribe((translate) => {
                this.subtitleBuilder(translate).then(subtitle => {
                    let alert = this.alertCtrl.create({
                        title: translate['CONFIRM_TRANSACTION'],
                        subTitle: subtitle,
                        inputs: [
                            {
                                name: 'password',
                                placeholder: translate['PASSWORD'],
                                type: 'password'
                            },
                        ],
                        buttons: [
                            {
                                text: translate['CANCEL'],
                                role: 'cancel'
                            },
                            {
                                text: translate['CONFIRM'],
                                handler: data => {
                                     this.keyboard.close();
                                     if (this.wallet.passwordMatchesWallet(data.password, this.selectedWallet)) {
                                        this.announceTransaction(data.password)
                                    }else {
                                        this.alert.showInvalidPasswordAlert();
                                    }
                                }
                            }
                        ]
                    });
                    alert.onDidDismiss(() => {
                        this.keyboard.close()
                    });
                    alert.present();
                });
            });
    }

    /**
     * Announces transaction
     * @param password  string
     */
    private announceTransaction(password: string){
        let loader = this.loading.create({
            content: this.translate['PLEASE_WAIT']
        });
        loader.present().then(_ => {
            if (recipientAddress.length == 40){
                const tx = createTX(recipientAddress, mosaicCode, msg, networkType, amount);
                const stx = singTX(tx, generationHash, privateKey, networkType);
                const rtx = announceTX (stx)
                this.toast.showTransactionConfirmed();
                this.navCtrl.push(BalancePage, {});
            } else {
                this.alert.showError("Wrong Address");
            }
            // let a = alert("Cuenta: "  + recipientAddress + "\n" +
            //            "Monto: "   + amount +  "\n" +
            //           "Mensaje: " + msg);
            loader.dismiss();
            //this.throwError("error");
            //loader.dismiss();
        });
    }
    private throwError(error: any) {
        if (error.toString().indexOf('FAILURE_INSUFFICIENT_BALANCE') >= 0) {
            this.alert.showDoesNotHaveEnoughFunds();
        } else if (error.toString().indexOf('FAILURE_MESSAGE_TOO_LARGE') >= 0) {
            this.alert.showMessageTooLarge();
        } else if (error.toString().indexOf('FAILURE_MOSAIC_NOT_TRANSFERABLE') >= 0){
            this.alert.showMosaicNotTransferable();
        } else if (error.statusCode == 404) {
            this.alert.showAlertDoesNotBelongToNetwork();
        } else {
            this.alert.showError(error);
        }
    }
}
