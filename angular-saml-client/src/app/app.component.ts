import {Component, OnInit} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {HttpErrorResponse} from "@angular/common/http/src/response";
import { ActivatedRoute } from '@angular/router';

declare const AutoScript: any;
declare const Constants: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  title = 'app';

  apiToken: string;

  sessionId: string;

  errorMessage: string;

  externalServerApiExample;

  logoutSuccess: boolean;

  authServerApiExample: string;

  constructor(private httpClient: HttpClient,
      private route: ActivatedRoute) {

    this.route.queryParams.subscribe(params => {
        this.setSessionCookie(params['sessionId']);
    });
  }

  ngOnInit(): void {
    AutoScript.httpClient = this.httpClient;
    AutoScript.cargarAppAfirma();
    AutoScript.setServlets(Constants.URL_BASE_SERVICES + "/afirma-signature-storage/StorageService", Constants.URL_BASE_SERVICES + "/afirma-signature-retriever/RetrieveService");
  }

  setSessionCookie(sessionId: string) {
    if (sessionId != undefined && sessionId != "") {
      console.log('SessionId: ' + sessionId);
      //document.cookie = "JSESSIONID=" + sessionId;
      this.sessionId = sessionId;
    }
  }

  parseJwt (token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
};

  handleTokenSuccess(apiToken: string) {
    const payload = this.parseJwt(apiToken);

    console.log(payload);

    localStorage.setItem("apiToken", apiToken);
    this.apiToken = apiToken;
    this.errorMessage = null;
  }

  handleTokenError(error: HttpErrorResponse) {
    this.errorMessage = JSON.stringify(error);
  }

  postLogin() {
    var formData: any = new FormData();
    formData.append("username", 'juange');
    formData.append("password", 'juange');

    this.httpClient.post("/backend_auth/auth/login", formData,
      {
        withCredentials: true,
        responseType: 'text'
      }
      ).subscribe(
        r => { this.setSessionCookie(r)},
        error => this.handleTokenError(error));
  }

  getToken() {
    let apiToken = localStorage.getItem("apiToken");

    this.httpClient.get('/backend_auth/auth/token', {
      responseType: 'text',
    }).subscribe(
        r => this.handleTokenSuccess(r),
        error => this.handleTokenError(error));
  }

  callApiAuthServer() {
    let apiToken = localStorage.getItem("apiToken");

    this.httpClient.get('/backend_auth/api/hello', {
      responseType: 'text',
      withCredentials : true,
      headers: {
        "Authorization": apiToken != null ? apiToken : ''
      }
    }).subscribe(
      r => this.authServerApiExample = r,
      error => this.handleTokenError(error)
      );
  }

  callApiExternal() {
    let apiToken = localStorage.getItem("apiToken");

    this.httpClient.get('/backend/siraoNt/getSiraoNt/1', {
      headers: {
        "Authorization": apiToken
      }
    }).subscribe(r => this.externalServerApiExample = JSON.stringify(r));
  }

  certificateLogin() {
    window.location.href="/backend_auth/servlet/afirma/login";
  }

  samlLogin() {
    window.location.href="/backend_auth/saml/login";
  }

  logout() {
    console.log('logout');
    localStorage.removeItem('apiToken');
    this.httpClient.get('/backend_auth/saml/logout').subscribe(() => this.logoutSuccess = true);
  }

  firmarPDF() {
    let apiToken = localStorage.getItem("apiToken");

    this.httpClient.get('/backend/api/file', {
      headers: {
        "Authorization": apiToken
      },
      responseType: 'text'
    }).subscribe(r => this.doFirmarPDF(r));
  }

  doFirmarPDF(base64data) {
    try {
      var params = "signaturePositionOnPageLowerLeftX = 100\n" +
            "signaturePositionOnPageLowerLeftY = 25\n" +
            "signaturePositionOnPageUpperRightX = 500\n" +
            "signaturePositionOnPageUpperRightY = 50\n" +
            "signaturePage = -1\n";

      /*AutoScript.signAndSaveToFile (
        "sign",
        base64data,
        "SHA1withRSA",
        "AUTO",
        params,
        null,
        showSignResultCallback,
        showErrorCallback);*/

        AutoScript.sign(
					base64data,
					"SHA1withRSA",
					"AUTO",
					params,
					this.showSignResultCallback,
					this.showErrorCallback);

    } catch(e) {
      try {
        console.log("Type: " + AutoScript.getErrorType() + "\nMessage: " + AutoScript.getErrorMessage());
        console.log("Error: " + e);
      } catch(ex) {
        console.log("Error: " + e);
        console.log("Error: " + ex);
      }
    }
  }

  showSignResultCallback(docSignedBase64) {
    /*const source = `data:application/pdf;base64,${docSignedBase64}`;
    const link = document.createElement("a");
    link.href = source;
    link.download = "aaaa_resultado.pdf";
    link.click();*/

    let apiToken = localStorage.getItem("apiToken");

    const formData = new FormData();
    formData.append("file", docSignedBase64);

    AutoScript.httpClient.post("/backend/api/file", formData,
      {
        withCredentials: true,
        headers: {
          "Authorization": apiToken != null ? apiToken : ''
        }
      }
      ).subscribe(
        r => { console.log(r)},
        error => console.log(error));

    console.log("Firma OK");
  }

  showErrorCallback(errorType, errorMessage) {
    console.log("Type: " + errorType + "\nMessage: " + errorMessage);
  }

}
