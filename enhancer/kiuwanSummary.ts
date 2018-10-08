import Controls = require("VSS/Controls");
// import VSS_Service = require("VSS/Service");
import TFS_Build_Contracts = require("TFS/Build/Contracts");
import TFS_Build_Extension_Contracts = require("TFS/Build/ExtensionContracts");
import DT_Client = require("TFS/DistributedTask/TaskRestClient");

export class KiuwanSummary extends Controls.BaseControl {
    constructor() {
        super();
    }

    public initialize(): void {
        super.initialize();
        // Get configuration that's shared between extension and the extension host
        var sharedConfig: TFS_Build_Extension_Contracts.IBuildResultsViewExtensionConfig = VSS.getConfiguration();
        var vsoContext = VSS.getWebContext();
        if (sharedConfig) {
            // register your extension with host through callback
            sharedConfig.onBuildChanged((build: TFS_Build_Contracts.Build) => {
                this._initBuildInfo(build);

                // Get Kiuwan analysis results from the server stored there as build attachment inthe artifacts directory
                var taskClient = DT_Client.getClient();
                taskClient.getPlanAttachments(vsoContext.project.id, "build", build.orchestrationPlan.planId, "Kiuwantask.Baseline.Results").then((taskAttachments) => {
                    $.each(taskAttachments, (index, taskAttachment) => {
                        taskClient.getAttachmentContent(vsoContext.project.id,
                            "build",
                            build.orchestrationPlan.planId,
                            taskAttachment.timelineId,
                            taskAttachment.recordId,
                            taskAttachment.type,
                            taskAttachment.name).then((kiuwanResults) => {
                                let kiuwanJsonStr = String.fromCharCode.apply(null, new Uint8Array(kiuwanResults));
                                let kiuwanJson = JSON.parse(kiuwanJsonStr);
                                this.setKiuwanResultsLink(kiuwanJson.analysisURL);
                                this.populateSecuritySummary(kiuwanJson);
                                this.populateQaSummary(kiuwanJson);
                            }
                        );
                    });
                });

            });
        }
    }

    private _initBuildInfo(build: TFS_Build_Contracts.Build) {
    }

    private setKiuwanResultsLink(url) {
        this._element.find("#kiuwan-link").attr("href", url);
    }

    private populateSecuritySummary(kiuwanJson): void {
        // Only if Kiuwan returned security info
        if (kiuwanJson.security !== undefined) {
            // Get the data from the JSON returned by Kiuwan
            // Get security rating and display the stars accordingly
            let starYes = `<img src="images/star-yes.png" />`;
            let secRating = kiuwanJson.security.rating;
            switch (secRating) {
                case 1:
                    this._element.find("#sec-star-1").html(starYes);
                    break;
                case 2:
                    this._element.find("#sec-star-1").html(starYes);
                    this._element.find("#sec-star-2").html(starYes);
                    break;
                case 3:
                    this._element.find("#sec-star-1").html(starYes);
                    this._element.find("#sec-star-2").html(starYes);
                    this._element.find("#sec-star-3").html(starYes);
                    break;
                case 4:
                    this._element.find("#sec-star-1").html(starYes);
                    this._element.find("#sec-star-2").html(starYes);
                    this._element.find("#sec-star-3").html(starYes);
                    this._element.find("#sec-star-4").html(starYes);
                    break;
                case 5:
                    this._element.find("#sec-star-1").html(starYes);
                    this._element.find("#sec-star-2").html(starYes);
                    this._element.find("#sec-star-3").html(starYes);
                    this._element.find("#sec-star-4").html(starYes);
                    this._element.find("#sec-star-5").html(starYes);
                    break;
                default:
            }
        }
        else {
            let secEmpty = `There is no security info to display from Kiuwan<br />`;
            this._element.find("#sec-empty").html(secEmpty);
            this._element.find("#sec-summary").hide();
        }
    }

    private populateQaSummary(kiuwanJson): void {
        var color = "";
        // Only if Kiuwan returns QA info
        if (kiuwanJson["Quality indicator"] !== undefined) {
            // Get the QA indicator value and decide the color to display
            let qaIndicator = parseFloat(kiuwanJson["Quality indicator"].value);
            if (qaIndicator < 25) {
                color = "qa-l";
            }
            else if (qaIndicator < 50) {
                color = "qa-n";
            }
            else if (qaIndicator < 75) {
                color = "qa-h";
            }
            else if (qaIndicator <= 100) {
                color = "qa-vh";
            }

            // Set the QA indicator value and the corresponding color
            this._element.find("#qa-indicator-num").addClass(color);
            this._element.find("#qa-indicator-num").text(qaIndicator.toFixed(2));
        }
        else {
            let qaEmpty = `There is no QA indicator info to display from Kiuwan<br />`;
            this._element.find("#qa-empty").html(qaEmpty);
            this._element.find("#qa-indicator").hide();
        }
    }
}

KiuwanSummary.enhance(KiuwanSummary, $(".kiuwan-summary"), {});

// Notify the parent frame that the host has been loaded
VSS.notifyLoadSucceeded();


